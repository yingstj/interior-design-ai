import React, { useState, useCallback, useEffect, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import FurnitureSidebar from './components/FurnitureSidebar';
import SuggestionBox from './components/SuggestionBox';
import DesignCanvas from './components/DesignCanvas';
import ProjectHeader from './components/ProjectHeader';
import FloorPlanMetrics from './components/FloorPlanMetrics';
import TestDataCollector from './components/TestDataCollector';
import { findFurniture, getLayoutSuggestions, analyzeFloorPlan, getAutoPlacement, getDesignActions, getLayoutValidation, generateFurnitureImageUrl, AIServiceError } from './services/geminiService';
import { getFurnitureImageUrl } from './utils/furnitureRenderer';
import { saveProject, loadCurrentProject, clearProject, saveProjectToList, StorageError } from './services/projectService';
import ProjectList from './components/ProjectList';
import TemplateSelector from './components/TemplateSelector';
import CostBreakdown from './components/CostBreakdown';
import type { RoomTemplate } from './data/roomTemplates';
import type { Room, FurnitureItem, PlacedFurnitureItem, Suggestion, Point, LoadingState, DesignAction, AutoSuggestion, Project, AppError, DrawingMode, DrawnFloorPlan } from './types';
import ArchitecturalPalette, { type ArchitecturalElement } from './components/ArchitecturalPalette';
import DrawingCanvas from './components/DrawingCanvas';
import { convertDrawnPlanToAnalysis, validateFloorPlan } from './utils/floorPlanConverter';
import { vectorizeFloorPlan, initOpenCV, type VectorizeResult } from './utils/floorPlanVectorizer';
import { 
  DEFAULT_ROOM_WIDTH, 
  DEFAULT_ROOM_HEIGHT, 
  DEFAULT_STYLE, 
  DEFAULT_BUDGET, 
  AUTOSAVE_DEBOUNCE_MS, 
  LAYOUT_VALIDATION_DEBOUNCE_MS,
  FURNITURE_IMAGE_SIZE,
  ROTATION_INCREMENT,
  MAX_ROTATION
} from './constants';

const createNewProject = (): Project => ({
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    lastModified: Date.now(),
    room: { width: DEFAULT_ROOM_WIDTH, height: DEFAULT_ROOM_HEIGHT },
    placedFurniture: [],
    stylePreference: DEFAULT_STYLE,
    budget: DEFAULT_BUDGET,
    cart: [],
});

function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [searchedFurniture, setSearchedFurniture] = useState<FurnitureItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [autoSuggestions, setAutoSuggestions] = useState<AutoSuggestion[]>([]);
  const [error, setError] = useState<AppError | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('Analyzing floor plan...');
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [lastImageName, setLastImageName] = useState('');
  const [showTestCollector, setShowTestCollector] = useState(false);
  const [vectorizedSvg, setVectorizedSvg] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  
  // History management for undo/redo
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingOrRedoing = useRef(false);
  
  // Project list modal
  const [showProjectList, setShowProjectList] = useState(false);
  
  // Template selector modal
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Cost breakdown modal
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  
  // Drawing mode state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('off');
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<ArchitecturalElement | null>(null);
  const [drawnFloorPlan, setDrawnFloorPlan] = useState<DrawnFloorPlan>({
    walls: [],
    doors: [],
    windows: [],
    fixtures: [],
    roomLabels: [],
    dimensions: [],
  });

  // Initialize OpenCV.js for client-side vectorization
  useEffect(() => {
    initOpenCV().then((ready) => {
      if (ready) {
        console.log('✅ Floor plan vectorization ready (OpenCV.js loaded)');
      } else {
        console.warn('⚠️  OpenCV.js not available - vectorization will be skipped');
      }
    });
  }, []);

  // Load project on mount
  useEffect(() => {
    const existingProject = loadCurrentProject();
    let initialProject = existingProject || createNewProject();
    
    // Migrate old placeholder images to new SVG renderer
    if (initialProject) {
      const needsMigration = initialProject.placedFurniture.some(
        item => item.imageUrl?.includes('picsum.photos')
      );
      
      if (needsMigration) {
        initialProject = {
          ...initialProject,
          placedFurniture: initialProject.placedFurniture.map(item => ({
            ...item,
            imageUrl: item.imageUrl?.includes('picsum.photos')
              ? getFurnitureImageUrl(item.name)
              : item.imageUrl
          })),
          cart: initialProject.cart.map(item => ({
            ...item,
            imageUrl: item.imageUrl?.includes('picsum.photos')
              ? getFurnitureImageUrl(item.name)
              : item.imageUrl
          }))
        };
        // Save the migrated project
        saveProject(initialProject);
      }
    }
    
    setProject(initialProject);
    // Initialize history with the first project state
    setHistory([initialProject]);
    setHistoryIndex(0);
    // Save to multi-project list if it's a new project
    if (!existingProject) {
      saveProjectToList(initialProject);
    }
  }, []);
  
  // Track history for undo/redo
  useEffect(() => {
    if (!project || isUndoingOrRedoing.current) {
      return;
    }
    
    // Only add to history if there's a meaningful change
    if (history.length > 0 && historyIndex >= 0) {
      const currentSnapshot = history[historyIndex];
      const hasChanged = JSON.stringify(currentSnapshot) !== JSON.stringify(project);
      
      if (hasChanged) {
        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(project);
        
        // Limit history to 50 states to prevent memory issues
        const limitedHistory = newHistory.slice(-50);
        setHistory(limitedHistory);
        setHistoryIndex(limitedHistory.length - 1);
      }
    }
  }, [project?.placedFurniture, project?.room, project?.cart, project?.stylePreference, project?.budget]);
  
  // Create a stable reference for the project state to use in dependencies
  const projectStateForDeps = project ? JSON.stringify({
      room: project.room,
      placedFurniture: project.placedFurniture,
      stylePreference: project.stylePreference,
      budget: project.budget,
      name: project.name,
      cart: project.cart,
      id: project.id
  }) : null;

  // Autosave project on change
  useEffect(() => {
    if (project && projectStateForDeps) {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = window.setTimeout(() => {
            const currentProject = JSON.parse(projectStateForDeps);
            // We only need to save the project, not update the state here,
            // as that would trigger another save cycle. The lastModified time
            // is updated inside saveProject.
            const projectToSave = {
                ...project, // Get the latest state object reference
                ...currentProject // Use the values from the dependency string
            };
            saveProject(projectToSave);
            saveProjectToList(projectToSave);
            // Update lastModified timestamp in state to reflect in UI
            setProject(p => p ? { ...p, lastModified: Date.now() } : null);
        }, AUTOSAVE_DEBOUNCE_MS);
    }
    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
  }, [project, projectStateForDeps]);


  // Debounced effect for layout validation
  useEffect(() => {
    if (!project || project.placedFurniture.length === 0 || loadingState !== 'idle') {
      setAutoSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      const runLayoutValidation = async () => {
        const results = await getLayoutValidation(project.room, project.placedFurniture);
        setAutoSuggestions(results);
      };
      runLayoutValidation();
    }, LAYOUT_VALIDATION_DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [project?.placedFurniture, project?.room, loadingState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (isCmdOrCtrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      
      // Also support Cmd+Y for redo
      if (isCmdOrCtrl && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleNewProject = () => {
      if (window.confirm('Are you sure you want to start a new project? Unsaved changes will be lost.')) {
          const newProj = createNewProject();
          saveProjectToList(newProj);
          setProject(newProj);
          setHistory([newProj]);
          setHistoryIndex(0);
          setSearchedFurniture([]);
          setSuggestions([]);
          setAutoSuggestions([]);
      }
  };

  const handleSelectProject = (selectedProject: Project) => {
    // Save current project before switching
    if (project) {
      saveProjectToList(project);
    }
    
    setProject(selectedProject);
    setHistory([selectedProject]);
    setHistoryIndex(0);
    setSearchedFurniture([]);
    setSuggestions([]);
    setAutoSuggestions([]);
  };

  const handleShowProjects = () => {
    setShowProjectList(true);
  };

  const handleApplyTemplate = (template: RoomTemplate) => {
    if (!project) return;
    
    // Convert template furniture to placed items with IDs and images
    const placedItems: PlacedFurnitureItem[] = template.furniture.map((item, index) => ({
      ...item,
      id: `template-${Date.now()}-${index}`,
      imageUrl: getFurnitureImageUrl(item.name),
    }));

    // Update project with template data
    handleUpdateProject(p => ({
      ...p,
      room: {
        ...p.room,
        width: template.roomWidth,
        height: template.roomHeight,
        floorPlanImage: undefined,
        analysis: undefined,
        scaleFtPerPx: undefined,
      },
      placedFurniture: placedItems,
      stylePreference: template.style,
      cart: [], // Clear cart when applying template
    }));
    
    // Reset history with the new template state
    const updatedProject = {
      ...project,
      room: {
        ...project.room,
        width: template.roomWidth,
        height: template.roomHeight,
        floorPlanImage: undefined,
        analysis: undefined,
        scaleFtPerPx: undefined,
      },
      placedFurniture: placedItems,
      stylePreference: template.style,
      cart: [],
    };
    setHistory([updatedProject]);
    setHistoryIndex(0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setProject(history[newIndex]);
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setProject(history[newIndex]);
      setTimeout(() => {
        isUndoingOrRedoing.current = false;
      }, 0);
    }
  };

  const handleSaveProject = () => {
      if (project) {
        try {
          saveProject(project);
          setProject(p => p ? { ...p, lastModified: Date.now() } : null);
          setError(null);
        } catch (error) {
          console.error("Failed to save project:", error);
          const errorMessage = error instanceof StorageError 
            ? error.message 
            : 'Failed to save project. Please try again.';
          setError({
            message: errorMessage,
            type: 'storage',
            timestamp: Date.now()
          });
        }
      }
  };

  const handleRenameProject = (newName: string) => {
      setProject(p => p ? { ...p, name: newName } : null);
  };
  
  const handleUpdateProject = (updateFn: (p: Project) => Project) => {
    setProject(prev => prev ? updateFn(prev) : null);
  }

  const handleRoomUpdate = (newRoomData: Partial<Room>) => {
    handleUpdateProject(p => {
        const updatedRoom = { ...p.room, ...newRoomData };
        if (newRoomData.scaleFtPerPx && updatedRoom.analysis) {
          const scale = newRoomData.scaleFtPerPx;
          if (scale > 0) {
            const { width: imgWidth, height: imgHeight } = updatedRoom.analysis.imageDimensions;
            updatedRoom.width = parseFloat((imgWidth * scale).toFixed(2));
            updatedRoom.height = parseFloat((imgHeight * scale).toFixed(2));
          }
        }
        return { ...p, room: updatedRoom };
    });
  };
  
  const handleRoomLabelChange = (roomId: string, newLabel: string) => {
    handleUpdateProject(p => {
      if (!p.room.analysis) return p;
      const updatedRooms = p.room.analysis.rooms.map(r => 
        r.id === roomId ? { ...r, label: newLabel } : r
      );
      return { ...p, room: { ...p.room, analysis: { ...p.room.analysis, rooms: updatedRooms }}};
    });
  };

  const handleFloorPlanUpload = (file: File) => {
    // Check file size before processing
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      setError({
        message: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than ${maxSizeMB}MB.`,
        type: 'validation',
        timestamp: Date.now()
      });
      return;
    }

    console.log(`📤 Uploading floor plan: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
    setLastImageName(file.name);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageDataUrl = reader.result as string;
      const base64Data = imageDataUrl.split(',')[1];
      
      console.log(`🔍 Starting floor plan analysis (this may take 30-90 seconds)...`);
      console.log(`📊 Image size: ${(base64Data.length / 1024).toFixed(1)}KB (base64)`);
      
      setLoadingState('analyzing');
      setAnalysisProgress(0);
      setAnalysisMessage('Preparing floor plan...');
      handleUpdateProject(p => ({
        ...p, 
        room: {...p.room, floorPlanImage: imageDataUrl, analysis: undefined, scaleFtPerPx: undefined },
        placedFurniture: [],
        cart: []
      }));
      setAutoSuggestions([]);
      
      const startTime = Date.now();
      
      // Simulate progress updates with estimated timeline
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`⏳ Still analyzing... ${elapsed.toFixed(0)}s elapsed`);
        
        // Estimate progress based on typical analysis time (30-90s)
        // Use a logarithmic curve to simulate realistic progress
        const estimatedTotal = 60; // Assume 60s average
        const rawProgress = (elapsed / estimatedTotal) * 100;
        const cappedProgress = Math.min(rawProgress * 0.9, 90); // Cap at 90% until complete
        setAnalysisProgress(cappedProgress);
        
        // Update message based on elapsed time
        if (elapsed < 10) {
          setAnalysisMessage('Analyzing floor plan structure...');
        } else if (elapsed < 20) {
          setAnalysisMessage('Detecting walls and boundaries...');
        } else if (elapsed < 30) {
          setAnalysisMessage('Identifying doors and windows...');
        } else if (elapsed < 45) {
          setAnalysisMessage('Finding fixtures and features...');
        } else {
          setAnalysisMessage('Finalizing analysis...');
        }
      }, 2000); // Update every 2 seconds
      
      try {
        // Step 1: Try client-side vectorization (free, fast, accurate)
        let processedBase64 = base64Data;
        let vectorResult: VectorizeResult | null = null;
        try {
          console.log(`🎨 Step 1: Vectorizing floor plan (client-side)...`);
          setAnalysisMessage('Vectorizing floor plan...');
          vectorResult = await vectorizeFloorPlan(file);
          
          // Convert SVG to base64 for Claude analysis
          const svgBase64 = btoa(unescape(encodeURIComponent(vectorResult.svg)));
          processedBase64 = svgBase64;
          
          // Save SVG for download
          setVectorizedSvg(vectorResult.svg);
          
          console.log(`✅ Vectorization complete (SVG ${vectorResult.width}×${vectorResult.height})`);
        } catch (vecError) {
          console.warn(`⚠️  Vectorization failed, using original image:`, vecError);
          setVectorizedSvg(null);
          // Continue with original image
        }
        
        // Step 2: Analyze with Claude
        console.log(`🌐 Step 2: Sending to Claude for analysis...`);
        setAnalysisMessage('Analyzing architectural elements...');
        const analysisResult = await analyzeFloorPlan(processedBase64, true); // Skip server-side vectorization
        clearInterval(progressInterval);
        
        const elapsed = ((Date.now() - startTime) / 1000);
        console.log(`✅ Floor plan analysis completed in ${elapsed.toFixed(1)}s`);
        
        // Complete the progress bar
        setAnalysisProgress(100);
        setAnalysisMessage('Analysis complete!');
        setLastAnalysisTime(elapsed);
        
        const roomsWithIds = analysisResult.rooms.map((room, index) => ({
            ...room,
            id: room.id || `room-${Date.now()}-${index}`,
        }));
        const finalAnalysis = { ...analysisResult, rooms: roomsWithIds };
        
        // CRITICAL FIX: Update room dimensions to match floor plan image dimensions
        // This ensures coordinate scaling works correctly when rendering
        const imageDimensions = analysisResult.imageDimensions;
        const pixelsToFeet = project?.room.scaleFtPerPx || 0.1; // Default scale
        const newWidth = Math.round((imageDimensions.width * pixelsToFeet) * 10) / 10;
        const newHeight = Math.round((imageDimensions.height * pixelsToFeet) * 10) / 10;
        
        console.log(`📐 Updating room dimensions: ${newWidth}' × ${newHeight}' (from ${imageDimensions.width}px × ${imageDimensions.height}px)`);
        
        handleUpdateProject(p => ({ 
          ...p, 
          room: {
            ...p.room, 
            width: newWidth,
            height: newHeight,
            analysis: finalAnalysis 
          } 
        }));
        setError(null); // Clear any previous errors
        
        // Log detection metrics for testing purposes
        console.log(`📊 Detection Metrics:
  - Walls: ${analysisResult.walls?.length || 0}
  - Doors: ${analysisResult.doors?.length || 0}
  - Windows: ${analysisResult.windows?.length || 0}
  - Fixtures: ${analysisResult.fixtures?.length || 0}
  - Rooms: ${analysisResult.rooms?.length || 0}
        `);
      } catch (error) {
        clearInterval(progressInterval);
        setAnalysisProgress(0);
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`❌ Floor plan analysis failed after ${elapsed}s:`, error);
        
        let errorMessage = 'Floor plan analysis failed. Please try again.';
        
        if (error instanceof AIServiceError) {
          errorMessage = error.message;
          
          // Add helpful context for timeout errors
          if (errorMessage.includes('timed out')) {
            errorMessage += '\n\nTips:\n• Try a smaller image (< 1MB)\n• Ensure backend server is running\n• Check your internet connection';
          }
        }
        
        setError({
          message: errorMessage,
          type: 'ai',
          timestamp: Date.now()
        });
        // Revert the floor plan image on error
        handleUpdateProject(p => ({ ...p, room: {...p.room, floorPlanImage: undefined } }));
      } finally {
        setLoadingState('idle');
        setAnalysisProgress(0);
        setAnalysisMessage('Analyzing floor plan...');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFloorPlanClear = () => {
    handleUpdateProject(p => ({
      ...p,
      room: {...p.room, floorPlanImage: undefined, analysis: undefined, scaleFtPerPx: undefined },
      placedFurniture: [],
      cart: []
    }));
    setAutoSuggestions([]);
  };

  const handleSearch = async (query: string) => {
    if (!project) return;
    setLoadingState('searching');
    setSearchedFurniture([]);
    
    try {
      const results = await findFurniture(query, project.stylePreference, project.budget);
      setSearchedFurniture(results);
      setError(null);
    } catch (error) {
      console.error("Furniture search failed:", error);
      const errorMessage = error instanceof AIServiceError 
        ? error.message 
        : 'Failed to search for furniture. Please try again.';
      setError({
        message: errorMessage,
        type: 'ai',
        timestamp: Date.now()
      });
    } finally {
      setLoadingState('idle');
    }
  };

  const handleGetSuggestions = async () => {
    if (!project) return;
    setLoadingState('suggesting');
    setSuggestions([]);
    
    try {
      const results = await getLayoutSuggestions(project.room.width, project.room.height, project.placedFurniture, project.stylePreference, project.budget);
      setSuggestions(results);
      setError(null);
    } catch (error) {
      console.error("Layout suggestions failed:", error);
      const errorMessage = error instanceof AIServiceError 
        ? error.message 
        : 'Failed to generate layout suggestions. Please try again.';
      setError({
        message: errorMessage,
        type: 'ai',
        timestamp: Date.now()
      });
    } finally {
      setLoadingState('idle');
    }
  };

  const handleAutoDesign = async () => {
    if (!project || !project.room.analysis) return;
    setLoadingState('suggesting'); 
    
    try {
      const results = await getAutoPlacement(project.room.analysis, project.room.width, project.room.height, project.stylePreference, project.budget);
      const newFurniture = results.map((item): PlacedFurnitureItem => ({
        ...item,
        id: `placed-${Date.now()}-${item.name.replace(/\s/g, '')}`,
        imageUrl: generateFurnitureImageUrl(item.name, `auto-${item.name}`),
      }));
      handleUpdateProject(p => {
        // A new design replaces the layout, so the cart must be synced.
        // Since new items have new IDs, the cart will be empty.
        const newFurnitureIds = new Set(newFurniture.map(f => f.id));
        const updatedCart = p.cart.filter(cartItem => newFurnitureIds.has(cartItem.id));
        return { 
          ...p, 
          placedFurniture: newFurniture, 
          cart: updatedCart 
        };
      });
      setError(null);
    } catch (error) {
      console.error("Auto-design failed:", error);
      const errorMessage = error instanceof AIServiceError 
        ? error.message 
        : 'Auto-design failed. Please try again.';
      setError({
        message: errorMessage,
        type: 'ai',
        timestamp: Date.now()
      });
    } finally {
      setLoadingState('idle');
    }
  };
  
  const applySingleAction = (furnitureList: PlacedFurnitureItem[], action: DesignAction): PlacedFurnitureItem[] => {
    let updatedFurniture = [...furnitureList];
    switch (action.action) {
      case 'add':
        if (action.newItemData) {
          const newItem: PlacedFurnitureItem = {
            ...action.newItemData,
            id: `placed-${Date.now()}-${action.newItemData.name.replace(/\s/g, '-')}`,
            imageUrl: generateFurnitureImageUrl(action.newItemData.name, `action-add-${action.newItemData.name}`),
          };
          updatedFurniture.push(newItem);
        }
        break;
      case 'delete':
        if (action.itemIdToModify) {
          updatedFurniture = updatedFurniture.filter(item => item.id !== action.itemIdToModify);
        }
        break;
      case 'move':
        if (action.itemIdToModify && action.newPosition) {
          updatedFurniture = updatedFurniture.map(item =>
            item.id === action.itemIdToModify ? { ...item, position: action.newPosition } : item
          );
        }
        break;
      case 'rotate':
        if (action.itemIdToModify && action.newRotation !== undefined) {
          updatedFurniture = updatedFurniture.map(item =>
            item.id === action.itemIdToModify ? { ...item, rotation: action.newRotation } : item
          );
        }
        break;
      case 'replace':
        if (action.itemIdToReplace && action.newItemData) {
          const replacementItem: PlacedFurnitureItem = {
            ...action.newItemData,
            id: `placed-${Date.now()}-${action.newItemData.name.replace(/\s/g, '-')}`,
            imageUrl: generateFurnitureImageUrl(action.newItemData.name, `action-replace-${action.newItemData.name}`),
          };
          updatedFurniture = updatedFurniture.map(item =>
            item.id === action.itemIdToReplace ? replacementItem : item
          );
        }
        break;
    }
    return updatedFurniture;
  }

  const handleDesignCommand = async (prompt: string) => {
    if (!project) return;
    setLoadingState('suggesting');
    
    try {
      const actions = await getDesignActions(prompt, project.room, project.placedFurniture, project.stylePreference, project.budget);
      handleUpdateProject(p => {
        let currentFurniture = [...p.placedFurniture];
        actions.forEach(action => {
            currentFurniture = applySingleAction(currentFurniture, action);
        });
        // Sync cart: remove any items from cart that are no longer on the canvas.
        const currentFurnitureIds = new Set(currentFurniture.map(f => f.id));
        const updatedCart = p.cart.filter(cartItem => currentFurnitureIds.has(cartItem.id));

        return { ...p, placedFurniture: currentFurniture, cart: updatedCart };
      });
      setError(null);
    } catch (error) {
      console.error("Failed to execute AI design command:", error);
      const errorMessage = error instanceof AIServiceError 
        ? error.message 
        : 'Failed to execute design command. Please try again.';
      setError({
        message: errorMessage,
        type: 'ai',
        timestamp: Date.now()
      });
    } finally {
      setLoadingState('idle');
    }
  };
  
  const handleApplyAutoSuggestion = (suggestionToApply: AutoSuggestion) => {
    handleUpdateProject(p => {
      const updatedFurniture = applySingleAction(p.placedFurniture, suggestionToApply.action);
      // We only sync the cart here; don't add new items automatically.
      const updatedFurnitureIds = new Set(updatedFurniture.map(f => f.id));
      const updatedCart = p.cart.filter(item => updatedFurnitureIds.has(item.id));
      return { ...p, placedFurniture: updatedFurniture, cart: updatedCart };
    });
    setAutoSuggestions(prev => prev.filter(s => s !== suggestionToApply));
  };
  
  // Drawing mode handlers
  const handleToggleDrawingMode = () => {
    if (drawingMode === 'off') {
      setDrawingMode('draw');
      // Clear any uploaded floor plan analysis to start fresh
      if (!project?.room.analysis) {
        // Only clear if there's no existing analysis
        setDrawnFloorPlan({
          walls: [],
          doors: [],
          windows: [],
          fixtures: [],
          roomLabels: [],
          dimensions: [],
        });
      }
    } else {
      setDrawingMode('off');
      setSelectedDrawingTool(null);
      
      // Convert drawn plan to analysis format if there are elements
      if (drawnFloorPlan.walls.length > 0 || drawnFloorPlan.doors.length > 0) {
        const analysis = convertDrawnPlanToAnalysis(
          drawnFloorPlan,
          project?.room.width ? project.room.width * 12 : 800, // Convert feet to inches
          project?.room.height ? project.room.height * 12 : 600
        );
        
        // Validate the floor plan
        const validation = validateFloorPlan(analysis);
        if (validation.warnings.length > 0) {
          console.warn('Floor plan validation warnings:', validation.warnings);
        }
        
        // Update the project with the new analysis
        handleUpdateProject(p => ({
          ...p,
          room: {
            ...p.room,
            analysis,
          }
        }));
      }
    }
  };
  
  const handleDrawnPlanUpdate = (newPlan: DrawnFloorPlan) => {
    setDrawnFloorPlan(newPlan);
  };
  
  const handleClearDrawnPlan = () => {
    setDrawnFloorPlan({
      walls: [],
      doors: [],
      windows: [],
      fixtures: [],
      roomLabels: [],
      dimensions: [],
    });
    handleUpdateProject(p => ({
      ...p,
      room: {
        ...p.room,
        analysis: undefined,
      }
    }));
  };
  
  const handleFurnitureAdd = (item: FurnitureItem, position: Point) => {
    const newItemId = `placed-${Date.now()}`;
    const newItem: PlacedFurnitureItem = { ...item, id: newItemId, position, rotation: 0, };
    handleUpdateProject(p => ({
      ...p,
      placedFurniture: [...p.placedFurniture, newItem],
    }));
  };
  
  const handleAddToCart = (itemToAdd: PlacedFurnitureItem) => {
    handleUpdateProject(p => {
        if (p.cart.some(cartItem => cartItem.id === itemToAdd.id)) {
            return p; // Already in cart
        }
        return { ...p, cart: [...p.cart, itemToAdd] };
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
      handleUpdateProject(p => ({
          ...p,
          cart: p.cart.filter(item => item.id !== itemId),
      }));
  };

  const handleFurnitureMove = (id: string, newPosition: Point) => {
    handleUpdateProject(p => ({
      ...p,
      placedFurniture: p.placedFurniture.map(item => (item.id === id ? { ...item, position: newPosition } : item)),
      cart: p.cart.map(item => (item.id === id ? { ...item, position: newPosition } : item)),
    }));
  };
  
  const handleFurnitureRotate = (id: string) => {
    handleUpdateProject(p => ({
      ...p,
      placedFurniture: p.placedFurniture.map(item => (item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item)),
      cart: p.cart.map(item => (item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item)),
    }));
  };
  
  const handleFurnitureDelete = (id: string) => {
    handleUpdateProject(p => ({
      ...p,
      placedFurniture: p.placedFurniture.filter(item => item.id !== id),
      cart: p.cart.filter(item => item.id !== id),
    }));
  };
  
  if (!project) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full px-6 py-4">
           <ProjectHeader 
            projectName={project.name}
            onRename={handleRenameProject}
            onSave={handleSaveProject}
            onNew={handleNewProject}
            lastSaved={project.lastModified}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onShowProjects={handleShowProjects}
          />
        </div>
      </header>
      
      {/* Error Display */}
      {error && (
        <div className="px-6 pt-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
                  {error.message}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Left Sidebar - Scrollable */}
          <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6 lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
            {drawingMode === 'draw' ? (
              <>
                {/* Architectural Drawing Palette */}
                <ArchitecturalPalette
                  onElementSelect={setSelectedDrawingTool}
                  selectedElement={selectedDrawingTool}
                  isDrawingMode={true}
                />
                
                {/* Drawing Controls */}
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 space-y-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Drawing Controls
                  </h3>
                  
                  <button
                    onClick={handleClearDrawnPlan}
                    className="w-full px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                  </button>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold">Element Count:</p>
                    <ul className="pl-4 space-y-1">
                      <li>• Walls: {drawnFloorPlan.walls.length}</li>
                      <li>• Doors: {drawnFloorPlan.doors.length}</li>
                      <li>• Windows: {drawnFloorPlan.windows.length}</li>
                      <li>• Fixtures: {drawnFloorPlan.fixtures.length}</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ControlPanel
                  room={project.room}
                  onRoomUpdate={handleRoomUpdate}
                  onFloorPlanUpload={handleFloorPlanUpload}
                  onFloorPlanClear={handleFloorPlanClear}
                  stylePreference={project.stylePreference}
                  onStyleChange={(style) => handleUpdateProject(p => ({...p, stylePreference: style}))}
                  budget={project.budget}
                  onBudgetChange={(b) => handleUpdateProject(p => ({...p, budget: b}))}
                  loadingState={loadingState}
                  onShowTemplates={() => setShowTemplateSelector(true)}
                  analysisProgress={analysisProgress}
                  analysisMessage={analysisMessage}
                />
                <div className="flex-grow min-h-[200px]">
                  <FurnitureSidebar 
                    onSearch={handleSearch} 
                    searchedFurniture={searchedFurniture} 
                    loadingState={loadingState} 
                    cart={project.cart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onShowBreakdown={() => setShowCostBreakdown(true)}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Center Canvas - Sticky */}
          <div className="lg:col-span-6 lg:sticky lg:top-4 lg:h-[calc(100vh-140px)] flex flex-col gap-4 lg:overflow-hidden">
            {drawingMode === 'draw' ? (
              <div className="flex-grow">
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-indigo-200 h-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Floor Plan Drawing Canvas
                  </h2>
                  <DrawingCanvas
                    width={800}
                    height={550}
                    scale={project.room.scaleFtPerPx || 0.1}
                    selectedTool={selectedDrawingTool}
                    drawnPlan={drawnFloorPlan}
                    onPlanUpdate={handleDrawnPlanUpdate}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex-grow">
                  <DesignCanvas
                    room={project.room}
                    placedFurniture={project.placedFurniture}
                    onFurnitureAdd={handleFurnitureAdd}
                    onFurnitureMove={handleFurnitureMove}
                    onFurnitureRotate={handleFurnitureRotate}
                    onFurnitureDelete={handleFurnitureDelete}
                    onRoomLabelChange={handleRoomLabelChange}
                    onAddToCart={handleAddToCart}
                    cart={project.cart}
                    project={project}
                  />
                </div>
                {project.room.analysis && (
                  <FloorPlanMetrics analysis={project.room.analysis} />
                )}
                
                {/* SVG Preview & Download */}
                {vectorizedSvg && project.room.analysis && (
                  <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-emerald-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Vectorized Floor Plan
                    </h3>
                    
                    {/* SVG Preview */}
                    <div className="mb-3 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-h-48">
                      <div 
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: vectorizedSvg }}
                        style={{ maxHeight: '12rem', overflow: 'auto' }}
                      />
                    </div>
                    
                    {/* Download Button */}
                    <a
                      download="floorplan_vectorized.svg"
                      href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(vectorizedSvg)}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Vector SVG
                    </a>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ✨ Scalable vector format • Perfect for printing & editing
                    </p>
                  </div>
                )}
                
                {project.room.analysis && showTestCollector && (
                  <TestDataCollector 
                    analysis={project.room.analysis}
                    imageName={lastImageName}
                    analysisTime={lastAnalysisTime}
                  />
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Scrollable */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:h-[calc(100vh-140px)] lg:overflow-y-auto lg:pl-2">
            {project.room.analysis && (
              <button
                onClick={() => setShowTestCollector(!showTestCollector)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {showTestCollector ? 'Hide' : 'Show'} Test Collector
              </button>
            )}
            <SuggestionBox 
              suggestions={suggestions} 
              onGetSuggestions={handleGetSuggestions} 
              loadingState={loadingState}
              onAutoDesign={handleAutoDesign}
              room={project.room}
              placedFurniture={project.placedFurniture}
              onDesignCommand={handleDesignCommand}
              autoSuggestions={autoSuggestions}
              onApplyAutoSuggestion={handleApplyAutoSuggestion}
            />
          </div>
        </div>
      </main>
      
      {/* Project List Modal */}
      {showProjectList && (
        <ProjectList
          currentProjectId={project.id}
          onSelectProject={handleSelectProject}
          onCreateNew={handleNewProject}
          onClose={() => setShowProjectList(false)}
        />
      )}
      
      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
      
      {/* Cost Breakdown Modal */}
      {showCostBreakdown && (
        <CostBreakdown
          items={project.cart}
          onClose={() => setShowCostBreakdown(false)}
        />
      )}
    </div>
  );
}

export default App;
