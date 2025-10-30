import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { 
  Point, 
  DrawnFloorPlan, 
  DrawnWall, 
  DrawnDoor, 
  DrawnWindow, 
  DrawnFixture,
  DrawnRoomLabel,
  DrawnDimension,
  DrawingTool 
} from '../types';
import type { ArchitecturalElement } from './ArchitecturalPalette';
import {
  snapToGrid,
  snapWallTo90Degrees,
  snapToWalls,
  generateDoorSwingArc,
  findNearestWall,
  calculateDimension,
  calculateMidpoint,
  generateElementId,
  feetToPixels,
  WALL_THICKNESS,
} from '../utils/architecturalDrawing';

interface DrawingCanvasProps {
  width: number; // canvas width in pixels
  height: number; // canvas height in pixels
  scale: number; // feet per pixel
  selectedTool: ArchitecturalElement | null;
  drawnPlan: DrawnFloorPlan;
  onPlanUpdate: (plan: DrawnFloorPlan) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  width,
  height,
  scale,
  selectedTool,
  drawnPlan,
  onPlanUpdate,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [history, setHistory] = useState<DrawnFloorPlan[]>([drawnPlan]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [angle, setAngle] = useState<number | null>(null);
  const [forceAngle, setForceAngle] = useState(false); // Hold shift to force custom angle

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift key - force custom angle
      if (e.key === 'Shift') {
        setForceAngle(true);
      }
      
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      
      // Escape - clear selection
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setForceAngle(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyIndex, history]);
  
  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onPlanUpdate(history[newIndex]);
    }
  }, [historyIndex, history, onPlanUpdate]);
  
  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onPlanUpdate(history[newIndex]);
    }
  }, [historyIndex, history, onPlanUpdate]);
  
  // Save to history
  const saveToHistory = useCallback((newPlan: DrawnFloorPlan) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPlan);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Get mouse position relative to canvas
  const getCanvasPoint = useCallback((e: React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedTool) return;

    const point = snapToGrid(getCanvasPoint(e));
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
  }, [selectedTool, getCanvasPoint]);

  // Handle mouse move - update current drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = snapToGrid(getCanvasPoint(e));
    setCurrentPoint(point);

    if (isDrawing && startPoint && selectedTool) {
      // Calculate angle for walls
      if (selectedTool.type === 'wall') {
        const dx = point.x - startPoint.x;
        const dy = point.y - startPoint.y;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
        setAngle(angleDeg);
      }
    }
  }, [isDrawing, startPoint, selectedTool, getCanvasPoint]);

  // Handle mouse up - finalize element
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !selectedTool) return;

    const endPoint = snapToGrid(getCanvasPoint(e));
    
    // Create element based on tool type
    const newPlan = { ...drawnPlan };

    switch (selectedTool.type) {
      case 'wall': {
        // Use custom angle if Shift key is held, otherwise snap to 90°
        const snappedEnd = forceAngle ? endPoint : snapWallTo90Degrees(startPoint, endPoint);
        const finalEnd = snapToWalls(snappedEnd, drawnPlan.walls);
        const finalStart = snapToWalls(startPoint, drawnPlan.walls);
        
        // Calculate length to avoid creating zero-length walls
        const length = Math.hypot(finalEnd.x - finalStart.x, finalEnd.y - finalStart.y);
        
        if (length < 10) {
          console.warn('Wall too short, skipping:', length);
          break; // Don't create walls shorter than 10px
        }
        
        const wall: DrawnWall = {
          id: generateElementId('wall'),
          start: finalStart,
          end: finalEnd,
          thickness: WALL_THICKNESS * 2, // Make walls thicker for visibility (12px)
        };
        
        const actualAngle = Math.atan2(finalEnd.y - finalStart.y, finalEnd.x - finalStart.x) * 180 / Math.PI;
        console.log(`✅ Created wall: ${length.toFixed(0)}px long at ${actualAngle.toFixed(1)}°`);
        newPlan.walls.push(wall);
        break;
      }

      case 'door-swing': {
        const nearestWall = findNearestWall(startPoint, drawnPlan.walls);
        if (nearestWall) {
          const doorWidth = feetToPixels(3, scale); // 3 feet default
          const { swingHinge, swingEnd } = generateDoorSwingArc(
            nearestWall.closestPoint,
            doorWidth,
            0, // rotation determined by wall angle
            true // hinge on left
          );
          
          const door: DrawnDoor = {
            id: generateElementId('door'),
            type: 'swing',
            position: nearestWall.closestPoint,
            width: doorWidth,
            swingHinge,
            swingEnd,
            rotation: 0,
          };
          newPlan.doors.push(door);
        }
        break;
      }

      case 'window': {
        const nearestWall = findNearestWall(startPoint, drawnPlan.walls);
        if (nearestWall) {
          const windowWidth = feetToPixels(3, scale); // 3 feet default
          const window: DrawnWindow = {
            id: generateElementId('window'),
            type: 'standard',
            start: { ...nearestWall.closestPoint },
            end: { x: nearestWall.closestPoint.x + windowWidth, y: nearestWall.closestPoint.y },
            wallId: nearestWall.wall.id,
          };
          newPlan.windows.push(window);
        }
        break;
      }

      case 'fixture-toilet':
      case 'fixture-sink':
      case 'fixture-tub':
      case 'fixture-shower':
      case 'fixture-stove':
      case 'fixture-refrigerator':
      case 'fixture-dishwasher':
      case 'fixture-washer':
      case 'fixture-dryer': {
        const fixtureType = selectedTool.type.replace('fixture-', '') as DrawnFixture['type'];
        const defaultSize = selectedTool.defaultSize || { width: 2, height: 2 };
        
        const fixture: DrawnFixture = {
          id: generateElementId('fixture'),
          type: fixtureType,
          position: startPoint,
          rotation: 0,
          dimensions: {
            width: feetToPixels(defaultSize.width, scale),
            depth: feetToPixels(defaultSize.height, scale),
          },
          label: selectedTool.label,
        };
        newPlan.fixtures.push(fixture);
        break;
      }

      case 'room-label': {
        const label: DrawnRoomLabel = {
          id: generateElementId('label'),
          text: 'Room Name',
          position: startPoint,
          fontSize: 16,
        };
        newPlan.roomLabels.push(label);
        break;
      }

      case 'dimension': {
        const dimension: DrawnDimension = {
          id: generateElementId('dimension'),
          start: startPoint,
          end: endPoint,
          label: calculateDimension(startPoint, endPoint, scale),
        };
        newPlan.dimensions.push(dimension);
        break;
      }
    }

    onPlanUpdate(newPlan);
    saveToHistory(newPlan);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setAngle(null);
  }, [isDrawing, startPoint, selectedTool, drawnPlan, scale, getCanvasPoint, onPlanUpdate, saveToHistory, forceAngle]);

  // Render wall
  const renderWall = (wall: DrawnWall, isTemporary: boolean = false) => {
    // Calculate wall length to avoid rendering dots
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    
    // Don't render walls shorter than 5px (likely accidental clicks)
    if (length < 5) return null;
    
    return (
      <line
        key={wall.id}
        x1={wall.start.x}
        y1={wall.start.y}
        x2={wall.end.x}
        y2={wall.end.y}
        stroke={isTemporary ? '#9ca3af' : '#1f2937'}
        strokeWidth={isTemporary ? wall.thickness * 0.5 : wall.thickness}
        strokeLinecap="round"
        className={isTemporary ? 'pointer-events-none' : 'cursor-pointer hover:stroke-teal-600'}
        onClick={() => setSelectedElement(wall.id)}
      />
    );
  };

  // Render door
  const renderDoor = (door: DrawnDoor) => {
    const radius = Math.hypot(
      door.swingEnd.x - door.swingHinge.x,
      door.swingEnd.y - door.swingHinge.y
    );
    
    return (
      <g key={door.id}>
        {/* Door opening line */}
        <line
          x1={door.position.x}
          y1={door.position.y}
          x2={door.position.x + door.width}
          y2={door.position.y}
          stroke="#3b82f6"
          strokeWidth="2"
          className="cursor-pointer hover:stroke-teal-600"
          onClick={() => setSelectedElement(door.id)}
        />
        {/* Door swing arc */}
        <path
          d={`M ${door.swingHinge.x},${door.swingHinge.y} A ${radius} ${radius} 0 0 1 ${door.swingEnd.x} ${door.swingEnd.y}`}
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 3"
          className="cursor-pointer hover:stroke-teal-600"
          onClick={() => setSelectedElement(door.id)}
        />
      </g>
    );
  };

  // Render window
  const renderWindow = (window: DrawnWindow) => (
    <g key={window.id}>
      <line
        x1={window.start.x}
        y1={window.start.y}
        x2={window.end.x}
        y2={window.end.y}
        stroke="#10b981"
        strokeWidth="6"
        strokeLinecap="round"
        className="cursor-pointer hover:stroke-teal-600"
        onClick={() => setSelectedElement(window.id)}
      />
      {/* Window glass lines */}
      <line
        x1={window.start.x}
        y1={window.start.y - 3}
        x2={window.end.x}
        y2={window.end.y - 3}
        stroke="#10b981"
        strokeWidth="1"
        className="pointer-events-none"
      />
      <line
        x1={window.start.x}
        y1={window.start.y + 3}
        x2={window.end.x}
        y2={window.end.y + 3}
        stroke="#10b981"
        strokeWidth="1"
        className="pointer-events-none"
      />
    </g>
  );

  // Render fixture
  const renderFixture = (fixture: DrawnFixture) => {
    const halfWidth = fixture.dimensions.width / 2;
    const halfDepth = fixture.dimensions.depth / 2;
    
    return (
      <g key={fixture.id} transform={`rotate(${fixture.rotation}, ${fixture.position.x}, ${fixture.position.y})`}>
        <rect
          x={fixture.position.x - halfWidth}
          y={fixture.position.y - halfDepth}
          width={fixture.dimensions.width}
          height={fixture.dimensions.depth}
          fill="#f3f4f6"
          stroke="#6b7280"
          strokeWidth="2"
          rx="4"
          className="cursor-pointer hover:stroke-teal-600"
          onClick={() => setSelectedElement(fixture.id)}
        />
        {fixture.label && (
          <text
            x={fixture.position.x}
            y={fixture.position.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontFamily="Helvetica, Arial, sans-serif"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {fixture.label}
          </text>
        )}
      </g>
    );
  };

  // Render room label
  const renderRoomLabel = (label: DrawnRoomLabel) => (
    <text
      key={label.id}
      x={label.position.x}
      y={label.position.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={label.fontSize}
      fontFamily="Helvetica, Arial, sans-serif"
      fontWeight="bold"
      fill="#1f2937"
      className="cursor-pointer hover:fill-teal-600"
      onClick={() => setSelectedElement(label.id)}
    >
      {label.text}
    </text>
  );

  // Render dimension
  const renderDimension = (dimension: DrawnDimension) => {
    const midpoint = calculateMidpoint(dimension.start, dimension.end);
    
    return (
      <g key={dimension.id}>
        <line
          x1={dimension.start.x}
          y1={dimension.start.y}
          x2={dimension.end.x}
          y2={dimension.end.y}
          stroke="#8b5cf6"
          strokeWidth="1"
          strokeDasharray="4 2"
          className="cursor-pointer hover:stroke-teal-600"
          onClick={() => setSelectedElement(dimension.id)}
        />
        <circle cx={dimension.start.x} cy={dimension.start.y} r="3" fill="#8b5cf6" />
        <circle cx={dimension.end.x} cy={dimension.end.y} r="3" fill="#8b5cf6" />
        <text
          x={midpoint.x}
          y={midpoint.y - 10}
          textAnchor="middle"
          fontSize="12"
          fontFamily="Helvetica, Arial, sans-serif"
          fill="#8b5cf6"
          className="pointer-events-none select-none"
        >
          {dimension.label}
        </text>
      </g>
    );
  };

  // Render temporary element being drawn
  const renderTemporaryElement = () => {
    if (!isDrawing || !startPoint || !currentPoint || !selectedTool) return null;

    if (selectedTool.type === 'wall') {
      const snappedEnd = snapWallTo90Degrees(startPoint, currentPoint);
      const length = Math.hypot(snappedEnd.x - startPoint.x, snappedEnd.y - startPoint.y);
      
      const tempWall: DrawnWall = {
        id: 'temp',
        start: startPoint,
        end: snappedEnd,
        thickness: WALL_THICKNESS * 2,
        isTemporary: true,
      };
      
      return (
        <g>
          {renderWall(tempWall, true)}
          {/* Show length while drawing */}
          <text
            x={(startPoint.x + snappedEnd.x) / 2}
            y={(startPoint.y + snappedEnd.y) / 2 - 10}
            textAnchor="middle"
            fontSize="14"
            fontFamily="Helvetica, Arial, sans-serif"
            fill="#3b82f6"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {calculateDimension(startPoint, snappedEnd, scale)}
          </text>
        </g>
      );
    }

    if (selectedTool.type === 'dimension') {
      return (
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="4 2"
          className="pointer-events-none"
        />
      );
    }

    return null;
  };

  return (
    <div
      ref={canvasRef}
      className="relative bg-white border-2 border-gray-300 rounded-lg shadow-inner cursor-crosshair"
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Grid pattern - More visible with major/minor lines */}
      <svg
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          {/* Minor grid - 1ft intervals */}
          <pattern id="minor-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          </pattern>
          {/* Major grid - 5ft intervals */}
          <pattern id="major-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#minor-grid)" />
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d1d5db" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#major-grid)" />
      </svg>

      {/* Drawn elements */}
      <svg width={width} height={height} className="absolute inset-0">
        {/* Walls */}
        {drawnPlan.walls.map(wall => renderWall(wall))}
        
        {/* Doors */}
        {drawnPlan.doors.map(door => renderDoor(door))}
        
        {/* Windows */}
        {drawnPlan.windows.map(window => renderWindow(window))}
        
        {/* Fixtures */}
        {drawnPlan.fixtures.map(fixture => renderFixture(fixture))}
        
        {/* Room labels */}
        {drawnPlan.roomLabels.map(label => renderRoomLabel(label))}
        
        {/* Dimensions */}
        {drawnPlan.dimensions.map(dimension => renderDimension(dimension))}
        
        {/* Temporary element being drawn */}
        {renderTemporaryElement()}
      </svg>

      {/* Cursor tooltip showing selected tool and angle */}
      {selectedTool && currentPoint && (
        <div
          className="absolute pointer-events-none bg-black text-white px-2 py-1 rounded text-xs"
          style={{
            left: currentPoint.x + 10,
            top: currentPoint.y - 30,
          }}
        >
          {selectedTool.label}
          {angle !== null && selectedTool.type === 'wall' && (
            <span className="ml-2 font-mono">
              {forceAngle ? '🔓' : '🔒'} {angle.toFixed(1)}°
            </span>
          )}
        </div>
      )}
      
      {/* Undo/Redo controls */}
      <div className="absolute top-2 right-2 flex gap-2 bg-white rounded-lg shadow-md p-1 border border-gray-200">
        <button
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
            historyIndex === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Undo (Cmd/Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
            historyIndex >= history.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Redo (Cmd/Ctrl+Shift+Z)"
        >
          ↷ Redo
        </button>
      </div>
      
      {/* Shift key hint */}
      {isDrawing && selectedTool?.type === 'wall' && (
        <div className="absolute bottom-2 left-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
          {forceAngle ? (
            <span>🔓 <strong>Custom angle</strong> mode (release Shift to snap to 90°)</span>
          ) : (
            <span>🔒 Snapping to 90° (hold <strong>Shift</strong> for custom angle)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;

