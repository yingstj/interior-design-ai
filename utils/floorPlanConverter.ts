import type {
  FloorPlanAnalysis,
  DrawnFloorPlan,
  DrawnWall,
  DrawnDoor,
  DrawnWindow,
  DrawnFixture,
  Wall,
  Door,
  Window,
  Fixture,
  RoomZone,
  Point,
} from '../types';
import { simplifyPolyline, mergeCollinearWalls } from './architecturalDrawing';

/**
 * Convert drawn floor plan to FloorPlanAnalysis format
 * This ensures both analyzed and drawn plans share identical structure
 */

/**
 * Main conversion function
 */
export function convertDrawnPlanToAnalysis(
  drawnPlan: DrawnFloorPlan,
  canvasWidth: number,
  canvasHeight: number
): FloorPlanAnalysis {
  return {
    imageDimensions: {
      width: canvasWidth,
      height: canvasHeight,
    },
    walls: drawnPlan.walls.map(convertWall),
    doors: drawnPlan.doors.map(convertDoor),
    windows: drawnPlan.windows.map(convertWindow),
    fixtures: drawnPlan.fixtures.map(convertFixture),
    rooms: detectRoomsFromWalls(drawnPlan.walls, drawnPlan.roomLabels),
    entryDoor: detectEntryDoor(drawnPlan.doors),
    northAngle: 0, // Default to north = up
  };
}

/**
 * Convert drawn wall to analysis wall format
 */
function convertWall(wall: DrawnWall): Wall {
  return {
    start: { x: wall.start.x, y: wall.start.y },
    end: { x: wall.end.x, y: wall.end.y },
    thickness: wall.thickness,
  };
}

/**
 * Convert drawn door to analysis door format
 */
function convertDoor(door: DrawnDoor): Door {
  return {
    position: { x: door.position.x, y: door.position.y },
    width: door.width,
    swingHinge: { x: door.swingHinge.x, y: door.swingHinge.y },
    swingEnd: { x: door.swingEnd.x, y: door.swingEnd.y },
  };
}

/**
 * Convert drawn window to analysis window format
 */
function convertWindow(window: DrawnWindow): Window {
  return {
    start: { x: window.start.x, y: window.start.y },
    end: { x: window.end.x, y: window.end.y },
  };
}

/**
 * Convert drawn fixture to analysis fixture format
 */
function convertFixture(fixture: DrawnFixture): Fixture {
  return {
    type: fixture.type,
    position: { x: fixture.position.x, y: fixture.position.y },
    rotation: fixture.rotation,
    dimensions: {
      width: fixture.dimensions.width,
      depth: fixture.dimensions.depth,
    },
    label: fixture.label,
  };
}

/**
 * Detect rooms from walls and labels
 * This is a simplified version - traces wall boundaries to find enclosed spaces
 */
function detectRoomsFromWalls(
  walls: DrawnWall[],
  labels: { id: string; text: string; position: Point }[]
): RoomZone[] {
  // If no walls, return a single default room
  if (walls.length === 0) {
    return [{
      id: 'room-default',
      label: 'Room',
      polygon: [],
    }];
  }

  const rooms: RoomZone[] = [];

  // For each label, try to find the enclosing polygon of walls
  for (const label of labels) {
    const enclosingPolygon = findEnclosingPolygon(label.position, walls);
    if (enclosingPolygon.length > 0) {
      rooms.push({
        id: label.id.replace('label', 'room'),
        label: label.text,
        polygon: enclosingPolygon,
      });
    }
  }

  // If no labeled rooms found, try to detect rooms automatically
  if (rooms.length === 0) {
    const detectedRooms = detectRoomsAutomatically(walls);
    rooms.push(...detectedRooms);
  }

  return rooms;
}

/**
 * Find the polygon of walls that encloses a point
 * Uses flood fill approach to find bounded space
 */
function findEnclosingPolygon(point: Point, walls: DrawnWall[]): Point[] {
  // Simplified: return a bounding box of all walls for now
  // A full implementation would use a proper polygon detection algorithm
  
  if (walls.length === 0) return [];

  const allPoints = walls.flatMap(w => [w.start, w.end]);
  
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));

  // Return rectangle
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

/**
 * Detect rooms automatically from wall structure
 * Returns detected enclosed spaces
 */
function detectRoomsAutomatically(walls: DrawnWall[]): RoomZone[] {
  // Simplified: create one room per disconnected wall group
  const rooms: RoomZone[] = [];
  
  if (walls.length === 0) return rooms;

  // Group connected walls
  const wallGroups = groupConnectedWalls(walls);
  
  wallGroups.forEach((group, index) => {
    const allPoints = group.flatMap(w => [w.start, w.end]);
    
    if (allPoints.length < 3) return; // Need at least 3 points for a polygon
    
    // Create convex hull or bounding box
    const polygon = createBoundingPolygon(allPoints);
    
    rooms.push({
      id: `room-${index + 1}`,
      label: `Room ${index + 1}`,
      polygon,
    });
  });

  return rooms.length > 0 ? rooms : [{
    id: 'room-1',
    label: 'Room 1',
    polygon: createBoundingPolygon(walls.flatMap(w => [w.start, w.end])),
  }];
}

/**
 * Group walls that are connected (share endpoints)
 */
function groupConnectedWalls(walls: DrawnWall[]): DrawnWall[][] {
  const groups: DrawnWall[][] = [];
  const visited = new Set<string>();

  for (const wall of walls) {
    if (visited.has(wall.id)) continue;

    const group: DrawnWall[] = [];
    const queue = [wall];
    visited.add(wall.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      // Find connected walls
      for (const other of walls) {
        if (visited.has(other.id)) continue;

        if (areWallsConnected(current, other)) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Check if two walls share an endpoint
 */
function areWallsConnected(wall1: DrawnWall, wall2: DrawnWall): boolean {
  const threshold = 5; // pixels
  
  return (
    distance(wall1.start, wall2.start) < threshold ||
    distance(wall1.start, wall2.end) < threshold ||
    distance(wall1.end, wall2.start) < threshold ||
    distance(wall1.end, wall2.end) < threshold
  );
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Create a bounding polygon from a set of points
 */
function createBoundingPolygon(points: Point[]): Point[] {
  if (points.length === 0) return [];

  // Simple bounding box (could be improved with convex hull algorithm)
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

/**
 * Detect the entry door (typically the largest or first door)
 */
function detectEntryDoor(doors: DrawnDoor[]): Point | undefined {
  if (doors.length === 0) return undefined;

  // Return the position of the first door as entry
  // Could be improved by finding the largest door or one closest to exterior walls
  return doors[0].position;
}

/**
 * Post-process and clean up floor plan analysis
 * Applies Douglas-Peucker simplification and merges collinear walls
 * Inspired by: https://github.com/syaltamimi/image-to-vector
 */
export function cleanFloorPlanAnalysis(analysis: FloorPlanAnalysis): FloorPlanAnalysis {
  console.log('🧹 Post-processing floor plan with vector simplification...');
  
  // STEP 1: Filter out invalid walls (too short, likely dots)
  const validWalls = analysis.walls.filter(wall => {
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (length < 5) {
      console.warn(`⚠️ Removing zero-length wall (${length.toFixed(1)}px)`);
      return false;
    }
    return true;
  });
  
  console.log(`🔍 Validated walls: ${analysis.walls.length} → ${validWalls.length} (removed ${analysis.walls.length - validWalls.length} dots)`);
  
  // STEP 2: Simplify room polygons (remove redundant points)
  const simplifiedRooms = analysis.rooms.map(room => ({
    ...room,
    polygon: simplifyPolyline(room.polygon, 3), // 3px tolerance
  }));
  
  // STEP 3: Merge collinear wall segments
  const mergedWalls = mergeCollinearWalls(
    validWalls.map(w => ({ start: w.start, end: w.end })),
    5 // 5 degree tolerance
  ).map(w => ({
    start: w.start,
    end: w.end,
    thickness: validWalls[0]?.thickness || 6,
  }));
  
  // Log wall length statistics
  const wallLengths = mergedWalls.map(w => 
    Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y)
  );
  const avgLength = wallLengths.reduce((a, b) => a + b, 0) / wallLengths.length;
  const minLength = Math.min(...wallLengths);
  const maxLength = Math.max(...wallLengths);
  
  console.log(`📏 Wall stats: avg=${avgLength.toFixed(0)}px, min=${minLength.toFixed(0)}px, max=${maxLength.toFixed(0)}px`);
  console.log(`✅ Simplified: ${analysis.rooms.length} rooms, merged ${validWalls.length} → ${mergedWalls.length} walls`);
  
  return {
    ...analysis,
    walls: mergedWalls,
    rooms: simplifiedRooms,
  };
}

/**
 * Validate a floor plan analysis for completeness
 */
export function validateFloorPlan(analysis: FloorPlanAnalysis): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!analysis.imageDimensions) {
    errors.push('Missing image dimensions');
  }

  if (!analysis.walls || analysis.walls.length === 0) {
    warnings.push('No walls defined');
  }

  if (!analysis.rooms || analysis.rooms.length === 0) {
    warnings.push('No rooms defined');
  }

  if (!analysis.doors || analysis.doors.length === 0) {
    warnings.push('No doors defined');
  }

  if (!analysis.windows || analysis.windows.length === 0) {
    warnings.push('No windows defined');
  }

  // Architectural quality checks
  if (analysis.walls) {
    // Check for very short walls (likely errors)
    const shortWalls = analysis.walls.filter(w => 
      Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) < 10
    );
    if (shortWalls.length > 0) {
      warnings.push(`${shortWalls.length} walls are very short (< 10px)`);
    }

    // Check for disconnected walls
    const connectedGroups = groupConnectedWalls(
      analysis.walls.map((w, i) => ({ ...w, id: `wall-${i}` }))
    );
    if (connectedGroups.length > 1) {
      warnings.push(`Floor plan has ${connectedGroups.length} disconnected wall groups`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

