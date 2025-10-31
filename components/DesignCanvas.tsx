import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { PlacedFurnitureItem, Room, FurnitureItem, Point, RoomZone, Project } from '../types';
import { exportCanvasAsImage } from '../utils/exportUtils';
import {
  renderFixture,
  renderNorthArrow,
  renderScaleBar,
  renderEntryArrow,
  renderTitleBlock,
  renderLegend
} from '../utils/architecturalRenderer';

interface DesignCanvasProps {
  room: Room;
  placedFurniture: PlacedFurnitureItem[];
  cart: PlacedFurnitureItem[];
  onFurnitureMove: (id: string, newPosition: Point) => void;
  onFurnitureAdd: (item: FurnitureItem, position: Point) => void;
  onFurnitureRotate: (id: string) => void;
  onFurnitureDelete: (id: string) => void;
  onRoomLabelChange: (roomId: string, newLabel: string) => void;
  onAddToCart: (item: PlacedFurnitureItem) => void;
  project: Project;
}

const getPolygonCentroid = (pts: Point[]): Point => {
    if (!pts || pts.length === 0) return { x: 0, y: 0 };
    const first = pts[0], last = pts[pts.length - 1];
    if (first.x !== last.x || first.y !== last.y) pts = [...pts, first];
    let twicearea = 0, x = 0, y = 0;
    const nPts = pts.length;
    let p1, p2, f;
    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
        p1 = pts[i]; p2 = pts[j];
        f = (p1.y - first.y) * (p2.x - first.x) - (p1.x - first.x) * (p2.y - first.y);
        twicearea += f;
        x += (p1.x + p2.x - 2 * first.x) * f;
        y += (p1.y + p2.y - 2 * first.y) * f;
    }
    f = twicearea * 3;
    return f === 0 ? { x: pts[0].x, y: pts[0].y } : { x: x / f + first.x, y: y / f + first.y };
}


const DesignCanvas: React.FC<DesignCanvasProps> = ({ 
  room, 
  placedFurniture,
  cart,
  onFurnitureMove, 
  onFurnitureAdd,
  onFurnitureRotate,
  onFurnitureDelete,
  onRoomLabelChange,
  onAddToCart,
  project,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedItem, setDraggedItem] = useState<{ id: string; offset: Point } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<PlacedFurnitureItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tempLabel, setTempLabel] = useState('');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showGrid, setShowGrid] = useState(true); // Default to ON for floor plans
  
  // Draggable annotation positions
  const [annotationPositions, setAnnotationPositions] = useState(() => {
    const saved = localStorage.getItem('annotationPositions');
    return saved ? JSON.parse(saved) : {
      legend: { x: 20, y: 20 },
      scaleBar: { x: 60, y: -1 }, // -1 means calculate from bottom
      northArrow: { x: -1, y: 60 }, // -1 means calculate from right
      titleBlock: { x: -1, y: -1 } // -1 means calculate from right/bottom
    };
  });
  const [draggedAnnotation, setDraggedAnnotation] = useState<{ type: string; offset: Point } | null>(null);
  
  const INCHES_PER_FOOT = 12;
  const roomWidthInches = room.width * INCHES_PER_FOOT;
  const roomHeightInches = room.height * INCHES_PER_FOOT;
  
  // Save annotation positions to localStorage
  useEffect(() => {
    localStorage.setItem('annotationPositions', JSON.stringify(annotationPositions));
  }, [annotationPositions]);
  
  // Calculate actual positions for annotations
  const getAnnotationPosition = (type: 'legend' | 'scaleBar' | 'northArrow' | 'titleBlock', scale: number) => {
    const pos = annotationPositions[type];
    const canvasWidth = roomWidthInches * scale;
    const canvasHeight = roomHeightInches * scale;
    
    return {
      x: pos.x === -1 ? canvasWidth - (type === 'northArrow' ? 60 : 360) : pos.x,
      y: pos.y === -1 ? canvasHeight - (type === 'scaleBar' ? 40 : 100) : pos.y
    };
  };
  
  // Handle annotation drag start
  const handleAnnotationMouseDown = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(
      (rect.width - 60) / roomWidthInches,
      (rect.height - 60) / roomHeightInches
    );
    
    const mouseX = (e.clientX - rect.left - 30) / scale;
    const mouseY = (e.clientY - rect.top - 30) / scale;
    
    const pos = getAnnotationPosition(type as any, 1);
    
    setDraggedAnnotation({
      type,
      offset: { x: mouseX - pos.x, y: mouseY - pos.y }
    });
  };
  
  // Handle annotation drag move
  const handleAnnotationMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedAnnotation || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const scale = Math.min(
      (rect.width - 60) / roomWidthInches,
      (rect.height - 60) / roomHeightInches
    );
    
    const mouseX = (e.clientX - rect.left - 30) / scale;
    const mouseY = (e.clientY - rect.top - 30) / scale;
    
    setAnnotationPositions(prev => ({
      ...prev,
      [draggedAnnotation.type]: {
        x: mouseX - draggedAnnotation.offset.x,
        y: mouseY - draggedAnnotation.offset.y
      }
    }));
  }, [draggedAnnotation, roomWidthInches, roomHeightInches]);
  
  // Handle annotation drag end
  const handleAnnotationMouseUp = useCallback(() => {
    setDraggedAnnotation(null);
  }, []);
  
  // Add/remove annotation drag listeners
  useEffect(() => {
    if (draggedAnnotation) {
      window.addEventListener('mousemove', handleAnnotationMouseMove);
      window.addEventListener('mouseup', handleAnnotationMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleAnnotationMouseMove);
        window.removeEventListener('mouseup', handleAnnotationMouseUp);
      };
    }
  }, [draggedAnnotation, handleAnnotationMouseMove, handleAnnotationMouseUp]);

  const getScale = () => {
    if (!svgRef.current) return 1;
    const { width, height } = svgRef.current.getBoundingClientRect();
    const scaleX = width / roomWidthInches;
    const scaleY = height / roomHeightInches;
    return Math.min(scaleX, scaleY);
  };

  const [scale, setScale] = useState(getScale());

  const scalingFactors = useMemo(() => {
    if (!room.analysis) return { x: 1, y: 1 };
    return {
      x: roomWidthInches / room.analysis.imageDimensions.width,
      y: roomHeightInches / room.analysis.imageDimensions.height,
    };
  }, [room.analysis, roomWidthInches, roomHeightInches]);

  useEffect(() => {
    const updateScale = () => setScale(getScale());
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [room.width, room.height]);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  const convertEventToSvgPoint = (e: React.MouseEvent | React.TouchEvent, touchIndex = 0): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > touchIndex) {
      clientX = e.touches[touchIndex].clientX;
      clientY = e.touches[touchIndex].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > touchIndex) {
      clientX = e.changedTouches[touchIndex].clientX;
      clientY = e.changedTouches[touchIndex].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    const pt = new DOMPoint(clientX, clientY);
    const svgPoint = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgPoint.x / scale, y: svgPoint.y / scale };
  };

  const handleMouseDown = (e: React.MouseEvent, item: PlacedFurnitureItem) => {
    e.stopPropagation();
    const pointInInches = convertEventToSvgPoint(e);
    setDraggedItem({
      id: item.id,
      offset: {
        x: pointInInches.x - item.position.x,
        y: pointInInches.y - item.position.y,
      },
    });
    setSelectedItemId(item.id);
  };

  const handleTouchStart = (e: React.TouchEvent, item: PlacedFurnitureItem) => {
    e.stopPropagation();
    const pointInInches = convertEventToSvgPoint(e, 0);
    setDraggedItem({
      id: item.id,
      offset: {
        x: pointInInches.x - item.position.x,
        y: pointInInches.y - item.position.y,
      },
    });
    setSelectedItemId(item.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem) return;
    const pointInInches = convertEventToSvgPoint(e);
    const newX = pointInInches.x - draggedItem.offset.x;
    const newY = pointInInches.y - draggedItem.offset.y;
    onFurnitureMove(draggedItem.id, { x: newX, y: newY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedItem) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const pointInInches = convertEventToSvgPoint(e, 0);
    const newX = pointInInches.x - draggedItem.offset.x;
    const newY = pointInInches.y - draggedItem.offset.y;
    onFurnitureMove(draggedItem.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  const handleTouchEnd = () => {
    setDraggedItem(null);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemJSON = e.dataTransfer.getData('application/json');
    if (itemJSON) {
      const item = JSON.parse(itemJSON) as FurnitureItem;
      const point = convertEventToSvgPoint(e as unknown as React.MouseEvent);
      onFurnitureAdd(item, { x: point.x - item.width/2, y: point.y - item.depth/2 });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).tagName.toLowerCase() !== 'input') {
      setSelectedItemId(null);
      handleLabelSave();
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedItemId) {
      if (e.key === 'r' || e.key === 'R') {
        onFurnitureRotate(selectedItemId);
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        onFurnitureDelete(selectedItemId);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, onFurnitureRotate, onFurnitureDelete]);

  const handleLabelEditStart = (e: React.MouseEvent, room: RoomZone) => {
      e.stopPropagation();
      setEditingRoomId(room.id);
      setTempLabel(room.label);
  };

  const handleLabelSave = () => {
      if (editingRoomId && tempLabel.trim()) {
          onRoomLabelChange(editingRoomId, tempLabel.trim());
      }
      setEditingRoomId(null);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleLabelSave();
      }
      if (e.key === 'Escape') {
          setEditingRoomId(null);
      }
  };

  const handleExport = async (format: 'png' | 'jpeg' = 'png') => {
    if (svgRef.current) {
      try {
        await exportCanvasAsImage(svgRef.current, project, format);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export canvas. Please try again.');
      }
    }
  };


  const renderGrid = () => {
    if (!showGrid) return null;
    
    const gridSize = 12; // 1 foot grid (minor)
    const majorGridSize = 60; // 5 feet grid (major)
    const lines = [];
    const labels = [];
    
    // Vertical lines
    for (let x = 0; x <= roomWidthInches; x += gridSize) {
      const isMajor = x % majorGridSize === 0;
      const feet = x / 12;
      
      lines.push(
        <line
          key={`v-${x}`}
          x1={x * scale}
          y1={0}
          x2={x * scale}
          y2={roomHeightInches * scale}
          stroke={isMajor ? "#9ca3af" : "#e5e7eb"}
          strokeWidth={isMajor ? "1.5" : "0.5"}
          strokeDasharray={isMajor ? "none" : "2 4"}
          opacity={isMajor ? "0.5" : "0.3"}
        />
      );
      
      // Add labels every 5 feet
      if (isMajor && feet > 0 && feet < room.width) {
        labels.push(
          <text
            key={`vl-${x}`}
            x={x * scale}
            y={-5}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
            fontFamily="Arial, sans-serif"
          >
            {feet}'
          </text>
        );
      }
    }
    
    // Horizontal lines
    for (let y = 0; y <= roomHeightInches; y += gridSize) {
      const isMajor = y % majorGridSize === 0;
      const feet = y / 12;
      
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y * scale}
          x2={roomWidthInches * scale}
          y2={y * scale}
          stroke={isMajor ? "#9ca3af" : "#e5e7eb"}
          strokeWidth={isMajor ? "1.5" : "0.5"}
          strokeDasharray={isMajor ? "none" : "2 4"}
          opacity={isMajor ? "0.5" : "0.3"}
        />
      );
      
      // Add labels every 5 feet
      if (isMajor && feet > 0 && feet < room.height) {
        labels.push(
          <text
            key={`hl-${y}`}
            x={-5}
            y={y * scale}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="#6b7280"
            fontFamily="Arial, sans-serif"
          >
            {feet}'
          </text>
        );
      }
    }
    
    // Origin indicator (0,0)
    labels.push(
      <g key="origin">
        <circle cx={0} cy={0} r="3" fill="#3b82f6" />
        <text
          x={8}
          y={-8}
          fontSize="10"
          fill="#3b82f6"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          0,0
        </text>
      </g>
    );
    
    return (
      <g opacity="0.8">
        {lines}
        {labels}
      </g>
    );
  };

  const renderRulers = () => {
    if (!showMeasurements) return null;
    
    const rulerElements = [];
    const markerInterval = 12; // Every foot
    
    // Top ruler (horizontal)
    for (let i = 0; i <= Math.floor(roomWidthInches / markerInterval); i++) {
      const x = i * markerInterval * scale;
      rulerElements.push(
        <g key={`ruler-top-${i}`}>
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={10 * scale}
            stroke="#6b7280"
            strokeWidth="2"
          />
          <text
            x={x}
            y={20 * scale}
            fontSize={10 * scale}
            fill="#374151"
            textAnchor="middle"
          >
            {i}'
          </text>
        </g>
      );
    }
    
    // Left ruler (vertical)
    for (let i = 0; i <= Math.floor(roomHeightInches / markerInterval); i++) {
      const y = i * markerInterval * scale;
      rulerElements.push(
        <g key={`ruler-left-${i}`}>
          <line
            x1={0}
            y1={y}
            x2={10 * scale}
            y2={y}
            stroke="#6b7280"
            strokeWidth="2"
          />
          <text
            x={20 * scale}
            y={y + 4 * scale}
            fontSize={10 * scale}
            fill="#374151"
            textAnchor="start"
          >
            {i}'
          </text>
        </g>
      );
    }
    
    return <g>{rulerElements}</g>;
  };

  const renderAnalyzedPlan = () => {
    if (!room.analysis) return null;
    const { walls, windows, doors, rooms, fixtures, entryDoor, northAngle } = room.analysis;
    const { x: sx, y: sy } = scalingFactors;

    // Calculate total square footage
    const totalSqFt = room.width * room.height;
    const roomDimString = `${room.width}' × ${room.height}'`;

    return (
      <g>
        {/* WALLS - Architectural line weight hierarchy */}
        {walls.map((wall, i) => {
          // Thicker walls are exterior (structural), thinner are interior partitions
          const isExterior = wall.thickness > 8;
          const strokeWidth = isExterior 
            ? wall.thickness * Math.min(sx, sy) * scale 
            : wall.thickness * Math.min(sx, sy) * scale * 0.6;
          
          return (
            <line
              key={`wall-${i}`}
              x1={wall.start.x * sx * scale}
              y1={wall.start.y * sy * scale}
              x2={wall.end.x * sx * scale}
              y2={wall.end.y * sy * scale}
              stroke="black"
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />
          );
        })}

        {/* WINDOWS - Double-line glass representation */}
        {windows.map((win, i) => {
          const dx = win.end.x - win.start.x;
          const dy = win.end.y - win.start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / length; // Normal vector
          const ny = dx / length;
          const offset = 2; // Offset for parallel lines

          return (
            <g key={`win-${i}`}>
              {/* First line (glass) */}
              <line
                x1={(win.start.x + nx * offset) * sx * scale}
                y1={(win.start.y + ny * offset) * sy * scale}
                x2={(win.end.x + nx * offset) * sx * scale}
                y2={(win.end.y + ny * offset) * sy * scale}
                stroke="black"
                strokeWidth={1.5}
                strokeLinecap="butt"
              />
              {/* Second line (glass) */}
              <line
                x1={(win.start.x - nx * offset) * sx * scale}
                y1={(win.start.y - ny * offset) * sy * scale}
                x2={(win.end.x - nx * offset) * sx * scale}
                y2={(win.end.y - ny * offset) * sy * scale}
                stroke="black"
                strokeWidth={1.5}
                strokeLinecap="butt"
              />
            </g>
          );
        })}

        {/* DOORS - Clear swing arcs with hinge points */}
        {doors.map((door, i) => {
          const hingeX = door.swingHinge.x * sx * scale;
          const hingeY = door.swingHinge.y * sy * scale;
          const endX = door.swingEnd.x * sx * scale;
          const endY = door.swingEnd.y * sy * scale;
          const doorPosX = door.position.x * sx * scale;
          const doorPosY = door.position.y * sy * scale;
          const doorWidth = door.width * sx * scale;
          
          const radius = Math.hypot(endX - hingeX, endY - hingeY);
          
          return (
            <g key={`door-${i}`}>
              {/* Door opening (thin line) */}
              <line
                x1={doorPosX}
                y1={doorPosY}
                x2={doorPosX + doorWidth}
                y2={doorPosY}
                stroke="black"
                strokeWidth={1}
                strokeLinecap="butt"
              />
              {/* Swing arc (quarter circle) */}
              <path
                d={`M ${hingeX},${hingeY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                stroke="black"
                strokeWidth={1}
                fill="none"
              />
              {/* Door panel line (from hinge to end) */}
              <line
                x1={hingeX}
                y1={hingeY}
                x2={endX}
                y2={endY}
                stroke="black"
                strokeWidth={1.5}
                strokeLinecap="butt"
              />
              {/* Hinge point (small circle) */}
              <circle
                cx={hingeX}
                cy={hingeY}
                r={2}
                fill="black"
              />
            </g>
          );
        })}
        {/* ROOMS - Subtle shading for outdoor/semi-enclosed spaces */}
        {rooms.map((roomZone) => {
          const centroid = getPolygonCentroid(roomZone.polygon);
          const isEditing = editingRoomId === roomZone.id;
          const isOutdoor = roomZone.label.toLowerCase().includes('balcony') || 
                           roomZone.label.toLowerCase().includes('terrace') ||
                           roomZone.label.toLowerCase().includes('patio');
          
          // Create polygon points string for SVG
          const polygonPoints = roomZone.polygon
            .map(p => `${p.x * sx * scale},${p.y * sy * scale}`)
            .join(' ');

          return (
            <g key={roomZone.id}>
              {/* Draw room boundary polygon with architectural styling */}
              <polygon
                points={polygonPoints}
                fill={isOutdoor ? "rgba(200, 200, 200, 0.15)" : "white"}
                stroke="none"
                className="pointer-events-none"
              />
              
              {/* Room label - architectural style */}
              {isEditing ? (
                <foreignObject
                  x={centroid.x * sx * scale - 60}
                  y={centroid.y * sy * scale - 18}
                  width="120"
                  height="36"
                >
                   <div className="w-full h-full">
                      <input
                          type="text"
                          value={tempLabel}
                          onChange={(e) => setTempLabel(e.target.value)}
                          onBlur={handleLabelSave}
                          onKeyDown={handleLabelKeyDown}
                          autoFocus
                          className="w-full h-full p-1 text-center bg-white border-2 border-blue-500 rounded-md text-sm shadow-lg"
                      />
                   </div>
                </foreignObject>
              ) : (
                <text
                  x={centroid.x * sx * scale}
                  y={centroid.y * sy * scale}
                  dy=".3em"
                  textAnchor="middle"
                  fill="black"
                  fontSize="12"
                  fontFamily="Arial, sans-serif"
                  className="cursor-pointer"
                  onClick={(e) => handleLabelEditStart(e, roomZone)}
                >
                  {roomZone.label}
                </text>
              )}
            </g>
          );
        })}

        {/* FIXTURES - Kitchen and bathroom fixtures */}
        {fixtures && fixtures.map((fixture, i) => renderFixture(fixture, sx, sy, scale, i))}

        {/* ANNOTATIONS - Architectural elements (Draggable) */}
        
        {/* North Arrow - draggable */}
        <g
          transform={`translate(${getAnnotationPosition('northArrow', scale).x}, ${getAnnotationPosition('northArrow', scale).y})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, 'northArrow')}
          className="cursor-move"
          style={{ opacity: draggedAnnotation?.type === 'northArrow' ? 0.7 : 1 }}
        >
          <rect x="-5" y="-5" width="60" height="60" fill="transparent" stroke="none" className="hover:fill-blue-50 hover:stroke-blue-300 hover:stroke-1" />
          {renderNorthArrow(0, 0, northAngle || 0, 40)}
          <text x="20" y="-10" fontSize="8" fill="#6b7280" textAnchor="middle" className="pointer-events-none select-none">
            ✋ Drag
          </text>
        </g>

        {/* Scale Bar - draggable */}
        <g
          transform={`translate(${getAnnotationPosition('scaleBar', scale).x}, ${getAnnotationPosition('scaleBar', scale).y})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, 'scaleBar')}
          className="cursor-move"
          style={{ opacity: draggedAnnotation?.type === 'scaleBar' ? 0.7 : 1 }}
        >
          <rect x="-5" y="-15" width="200" height="40" fill="transparent" stroke="none" className="hover:fill-blue-50 hover:stroke-blue-300 hover:stroke-1" />
          {renderScaleBar(0, 0, `0' ${Math.round(room.width / 4)}'  ${Math.round(room.width / 2)}'`, room.width * 12 * scale / 2)}
          <text x="100" y="-20" fontSize="8" fill="#6b7280" textAnchor="middle" className="pointer-events-none select-none">
            ✋ Drag to move
          </text>
        </g>

        {/* Entry Arrow - if entry door is defined */}
        {entryDoor && renderEntryArrow(entryDoor, sx, sy, scale, 30)}

        {/* Title Block - draggable */}
        <g
          transform={`translate(${getAnnotationPosition('titleBlock', scale).x}, ${getAnnotationPosition('titleBlock', scale).y})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, 'titleBlock')}
          className="cursor-move"
          style={{ opacity: draggedAnnotation?.type === 'titleBlock' ? 0.7 : 1 }}
        >
          <rect x="-5" y="-5" width="370" height="110" fill="transparent" stroke="none" className="hover:fill-blue-50 hover:stroke-blue-300 hover:stroke-1" />
          {renderTitleBlock(0, 0, project.name, roomDimString, totalSqFt, `1" = ${(room.width / (roomWidthInches * scale / 96)).toFixed(1)}'`)}
          <text x="180" y="-10" fontSize="8" fill="#6b7280" textAnchor="middle" className="pointer-events-none select-none">
            ✋ Drag to reposition
          </text>
        </g>

        {/* Legend - draggable */}
        <g
          transform={`translate(${getAnnotationPosition('legend', scale).x}, ${getAnnotationPosition('legend', scale).y})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, 'legend')}
          className="cursor-move"
          style={{ opacity: draggedAnnotation?.type === 'legend' ? 0.7 : 1 }}
        >
          <rect x="-5" y="-5" width="160" height="140" fill="transparent" stroke="none" className="hover:fill-blue-50 hover:stroke-blue-300 hover:stroke-1" />
          {renderLegend(
            0,
            0,
            [
              { abbr: 'Ref', meaning: 'Refrigerator' },
              { abbr: 'DW', meaning: 'Dishwasher' },
              { abbr: 'W/D', meaning: 'Washer/Dryer' },
              { abbr: 'CL', meaning: 'Closet' }
            ]
          )}
          <text x="80" y="-10" fontSize="8" fill="#6b7280" textAnchor="middle" className="pointer-events-none select-none">
            ✋ Drag to move
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 w-full h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center border-b-2 border-teal-100 pb-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Design Canvas
        </h2>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 bg-gradient-to-r from-gray-100 to-teal-50 px-3 py-2 rounded-lg border border-gray-200">
            {selectedItemId ? "Press 'R' to rotate, 'Delete' to remove" : "Click room label to edit"}
          </div>
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
              showMeasurements 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle measurements"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Ruler
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
              showGrid 
                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle grid"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => handleExport('png')}
            className="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1"
            title="Export as PNG"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>
      <div className="flex-grow w-full h-full relative" onDragOver={(e) => e.preventDefault()}>
        <svg
          ref={svgRef}
          className="w-full h-full bg-gradient-to-br from-gray-50 to-teal-50/30 rounded-lg border border-gray-200"
          viewBox={`-20 -20 ${roomWidthInches * scale + 40} ${roomHeightInches * scale + 40}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          {room.analysis ? (
             renderAnalyzedPlan()
          ) : (
            <>
              {room.floorPlanImage && (
                <image href={room.floorPlanImage} x="0" y="0" width={roomWidthInches * scale} height={roomHeightInches * scale} preserveAspectRatio="xMidYMid slice" />
              )}
              <rect
                x="0"
                y="0"
                width={roomWidthInches * scale}
                height={roomHeightInches * scale}
                fill={room.floorPlanImage ? 'none' : '#f7fafc'}
                stroke="#cbd5e0"
                strokeWidth="2"
              />
            </>
          )}

          {/* Grid overlay */}
          {renderGrid()}
          
          {/* Ruler markings */}
          {renderRulers()}

          {placedFurniture.map((item) => {
            const isSelected = item.id === selectedItemId;
            const isInCart = cart.some(cartItem => cartItem.id === item.id);
            
            // Debug logging for furniture dimensions
            if (isSelected) {
              console.log(`📐 Selected furniture: ${item.name}
  - Dimensions: ${item.width}" × ${item.depth}" (${(item.width/12).toFixed(1)}' × ${(item.depth/12).toFixed(1)}')
  - Position: (${item.position.x.toFixed(0)}, ${item.position.y.toFixed(0)})
  - Scale: ${scale.toFixed(2)}
  - Rendered size: ${(item.width * scale).toFixed(0)}px × ${(item.depth * scale).toFixed(0)}px
  - Image URL: ${item.imageUrl.substring(0, 50)}...`);
            }
            
            return (
              <g
                key={item.id}
                transform={`translate(${item.position.x * scale}, ${item.position.y * scale}) rotate(${item.rotation}, ${(item.width/2) * scale}, ${(item.depth/2) * scale})`}
                onMouseDown={(e) => handleMouseDown(e, item)}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onMouseEnter={(e) => {
                  setHoveredItem(item);
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    });
                  }
                }}
                onMouseMove={(e) => {
                  if (hoveredItem?.id === item.id) {
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltipPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-move touch-none transition-all duration-200"
              >
                {/* Background border/selection indicator */}
                <rect
                  width={item.width * scale}
                  height={item.depth * scale}
                  fill="white"
                  stroke={isSelected ? '#0f766e' : '#14b8a6'}
                  strokeWidth={isSelected ? 3 : 2}
                  rx="4"
                  className="transition-all duration-200"
                />
                
                {/* Furniture image */}
                <image
                  xlinkHref={item.imageUrl}
                  href={item.imageUrl}
                  x="2"
                  y="2"
                  width={(item.width * scale) - 4}
                  height={(item.depth * scale) - 4}
                  preserveAspectRatio="xMidYMid slice"
                  opacity="0.95"
                  className="pointer-events-none"
                />
                
                {/* Semi-transparent overlay for label background */}
                <rect
                  x="0"
                  y={(item.depth * scale) - 22}
                  width={item.width * scale}
                  height="22"
                  fill="rgba(0, 0, 0, 0.6)"
                  rx="0"
                  ry="0"
                  className="pointer-events-none"
                />
                
                <text
                  x={(item.width / 2) * scale}
                  y={(item.depth * scale) - 10}
                  dy=".3em"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none font-sans"
                >
                  {item.name}
                </text>
                
                {/* Dimensions display - always show when selected */}
                {isSelected && (
                  <>
                    {/* Dimension text */}
                    <text
                      x={(item.width / 2) * scale}
                      y={-10}
                      textAnchor="middle"
                      fill="#0f766e"
                      fontSize="11"
                      fontWeight="700"
                      className="pointer-events-none select-none font-sans"
                    >
                      {(item.width / 12).toFixed(1)}' × {(item.depth / 12).toFixed(1)}'
                    </text>
                    
                    {/* Dimension lines */}
                    <line
                      x1="-5"
                      y1={(item.depth * scale) / 2}
                      x2="-15"
                      y2={(item.depth * scale) / 2}
                      stroke="#0f766e"
                      strokeWidth="1.5"
                      markerStart="url(#arrowhead-left)"
                    />
                    <line
                      x1={(item.width * scale) / 2}
                      y1={(item.depth * scale) + 5}
                      x2={(item.width * scale) / 2}
                      y2={(item.depth * scale) + 15}
                      stroke="#0f766e"
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead-down)"
                    />
                  </>
                )}
                
                {/* Area calculation display */}
                {showMeasurements && (
                  <text
                    x={(item.width / 2) * scale}
                    y={(item.depth / 2) * scale + 15}
                    dy=".3em"
                    textAnchor="middle"
                    fill="white"
                    fontSize="8"
                    className="pointer-events-none select-none font-sans"
                  >
                    {(item.width / 12).toFixed(1)}' × {(item.depth / 12).toFixed(1)}' ({((item.width * item.depth) / 144).toFixed(1)} sq ft)
                  </text>
                )}

                {isSelected && !isInCart && (
                  <foreignObject x={(item.width * scale) - 48} y={-38} width="110" height="36" style={{ overflow: 'visible' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      onMouseDown={(e) => e.stopPropagation()} // Prevent triggering drag
                      className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-lg shadow-lg hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
                    >
                      Add to Cart
                    </button>
                  </foreignObject>
                )}
                 {isSelected && isInCart && (
                    <foreignObject x={(item.width * scale) - 35} y={-38} width="90" height="36" style={{ overflow: 'visible' }}>
                        <div className="flex items-center px-3 py-2 bg-white text-gray-700 text-xs font-bold rounded-lg shadow-lg border-2 border-emerald-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            In Cart
                        </div>
                    </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Annotation controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => {
              setAnnotationPositions({
                legend: { x: 20, y: 20 },
                scaleBar: { x: 60, y: -1 },
                northArrow: { x: -1, y: 60 },
                titleBlock: { x: -1, y: -1 }
              });
            }}
            className="px-3 py-2 bg-white text-gray-700 text-xs font-semibold rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-2"
            title="Reset annotation positions to default"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Positions
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignCanvas;