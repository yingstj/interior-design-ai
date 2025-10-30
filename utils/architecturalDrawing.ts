import type { Point, DrawnWall, DrawnDoor, DrawnWindow, DrawnFixture } from '../types';

/**
 * Architectural drawing utilities for smart behaviors
 * - Wall snapping to 90° angles
 * - Door arc auto-generation
 * - Window placement in walls
 * - Dimension calculation
 */

// Constants
export const WALL_THICKNESS = 6; // pixels, represents ~6 inches at typical scale
export const SNAP_ANGLE_THRESHOLD = 15; // degrees
export const SNAP_DISTANCE_THRESHOLD = 20; // pixels
export const GRID_SIZE = 10; // pixels

/**
 * Snap a point to the nearest grid intersection
 */
export function snapToGrid(point: Point, gridSize: number = GRID_SIZE): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Calculate angle between two points in degrees
 */
export function calculateAngle(start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Snap wall to 90° angles (horizontal or vertical)
 * Returns the snapped end point
 */
export function snapWallTo90Degrees(start: Point, end: Point): Point {
  const angle = calculateAngle(start, end);
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  
  // Determine if closer to horizontal (0°, 180°) or vertical (90°, 270°)
  const normalizedAngle = ((angle % 180) + 180) % 180;
  
  if (Math.abs(normalizedAngle) < 45 || Math.abs(normalizedAngle - 180) < 45) {
    // Snap to horizontal
    return { x: end.x, y: start.y };
  } else {
    // Snap to vertical
    return { x: start.x, y: end.y };
  }
}

/**
 * Snap wall endpoint to nearby wall endpoints or midpoints
 * Returns the snapped point if within threshold, otherwise original point
 */
export function snapToWalls(
  point: Point,
  existingWalls: DrawnWall[],
  threshold: number = SNAP_DISTANCE_THRESHOLD
): Point {
  let closestPoint = point;
  let minDistance = threshold;

  for (const wall of existingWalls) {
    // Check start point
    const distToStart = Math.hypot(point.x - wall.start.x, point.y - wall.start.y);
    if (distToStart < minDistance) {
      minDistance = distToStart;
      closestPoint = wall.start;
    }

    // Check end point
    const distToEnd = Math.hypot(point.x - wall.end.x, point.y - wall.end.y);
    if (distToEnd < minDistance) {
      minDistance = distToEnd;
      closestPoint = wall.end;
    }
  }

  return closestPoint;
}

/**
 * Generate door swing arc points
 * Returns the hinge and swing end points for a door
 */
export function generateDoorSwingArc(
  position: Point,
  width: number, // in pixels
  rotation: number, // 0, 90, 180, 270 degrees
  hingeLeft: boolean = true
): { swingHinge: Point; swingEnd: Point } {
  const radians = (rotation * Math.PI) / 180;
  
  // Calculate hinge position (either left or right side of door opening)
  const hingeOffset = hingeLeft ? 0 : width;
  const swingHinge = {
    x: position.x + hingeOffset * Math.cos(radians),
    y: position.y + hingeOffset * Math.sin(radians),
  };
  
  // Calculate swing end (90-degree rotation from door position)
  const swingAngle = radians + (hingeLeft ? Math.PI / 2 : -Math.PI / 2);
  const swingEnd = {
    x: swingHinge.x + width * Math.cos(swingAngle),
    y: swingHinge.y + width * Math.sin(swingAngle),
  };
  
  return { swingHinge, swingEnd };
}

/**
 * Find the nearest wall to a point
 * Returns the wall and the closest point on that wall
 */
export function findNearestWall(
  point: Point,
  walls: DrawnWall[],
  maxDistance: number = 50
): { wall: DrawnWall; closestPoint: Point; distance: number } | null {
  let nearestWall: DrawnWall | null = null;
  let closestPoint: Point = point;
  let minDistance = maxDistance;

  for (const wall of walls) {
    // Calculate distance from point to line segment
    const { point: projectedPoint, distance } = projectPointOntoLineSegment(
      point,
      wall.start,
      wall.end
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestWall = wall;
      closestPoint = projectedPoint;
    }
  }

  if (!nearestWall) return null;

  return { wall: nearestWall, closestPoint, distance: minDistance };
}

/**
 * Project a point onto a line segment
 * Returns the closest point on the segment and the distance
 */
export function projectPointOntoLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { point: Point; distance: number } {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is actually a point
    const distance = Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    return { point: lineStart, distance };
  }

  // Calculate projection parameter t (0 <= t <= 1)
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Calculate projected point
  const projectedPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  const distance = Math.hypot(point.x - projectedPoint.x, point.y - projectedPoint.y);

  return { point: projectedPoint, distance };
}

/**
 * Calculate distance between two points in feet/inches
 * Returns formatted string like "12'3\""
 */
export function calculateDimension(
  start: Point,
  end: Point,
  scale: number // feet per pixel
): string {
  const distancePixels = Math.hypot(end.x - start.x, end.y - start.y);
  const distanceFeet = distancePixels * scale;
  const feet = Math.floor(distanceFeet);
  const inches = Math.round((distanceFeet - feet) * 12);

  if (inches === 0) {
    return `${feet}'`;
  } else if (inches === 12) {
    return `${feet + 1}'`;
  } else {
    return `${feet}'${inches}"`;
  }
}

/**
 * Calculate the midpoint between two points
 */
export function calculateMidpoint(start: Point, end: Point): Point {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

/**
 * Check if a point is inside a rectangle (for fixture placement)
 */
export function isPointInRectangle(
  point: Point,
  rectCenter: Point,
  width: number,
  height: number,
  rotation: number = 0
): boolean {
  // Translate point to rect's local coordinates
  const dx = point.x - rectCenter.x;
  const dy = point.y - rectCenter.y;

  // Rotate point back by -rotation
  const radians = (-rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Check if within bounds
  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
}

/**
 * Generate a unique ID for drawn elements
 */
export function generateElementId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert feet to pixels based on scale
 */
export function feetToPixels(feet: number, scale: number): number {
  return feet / scale;
}

/**
 * Convert pixels to feet based on scale
 */
export function pixelsToFeet(pixels: number, scale: number): number {
  return pixels * scale;
}

/**
 * Rotate a point around a center point
 */
export function rotatePoint(point: Point, center: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Douglas-Peucker algorithm for polyline simplification
 * Reduces number of points while preserving shape
 * Used to clean up wall segments and room polygons
 */
export function simplifyPolyline(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from line segment
  let maxDistance = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursive call on first part
    const leftPart = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
    // Recursive call on second part
    const rightPart = simplifyPolyline(points.slice(maxIndex), tolerance);

    // Concatenate results (remove duplicate middle point)
    return [...leftPart.slice(0, -1), ...rightPart];
  } else {
    // All points between start and end can be removed
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is actually a point
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  // Calculate perpendicular distance
  const numerator = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  const denominator = Math.sqrt(lengthSquared);

  return numerator / denominator;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Merge collinear wall segments
 * If two walls share an endpoint and are nearly parallel, merge them
 */
export function mergeCollinearWalls(
  walls: { start: Point; end: Point }[],
  angleTolerance: number = 5 // degrees
): { start: Point; end: Point }[] {
  if (walls.length === 0) return [];

  const merged: { start: Point; end: Point }[] = [];
  const used = new Set<number>();

  for (let i = 0; i < walls.length; i++) {
    if (used.has(i)) continue;

    let current = walls[i];
    used.add(i);

    // Try to extend this wall by merging with collinear walls
    let extended = true;
    while (extended) {
      extended = false;

      for (let j = 0; j < walls.length; j++) {
        if (used.has(j)) continue;

        const candidate = walls[j];

        // Check if candidate connects to current's end
        if (distance(current.end, candidate.start) < 10) {
          // Check if nearly collinear
          const angle1 = calculateAngle(current.start, current.end);
          const angle2 = calculateAngle(candidate.start, candidate.end);
          const angleDiff = Math.abs(((angle1 - angle2 + 180) % 360) - 180);

          if (angleDiff < angleTolerance) {
            // Merge: extend current wall to candidate's end
            current = { start: current.start, end: candidate.end };
            used.add(j);
            extended = true;
            break;
          }
        }

        // Check if candidate connects to current's start
        if (distance(current.start, candidate.end) < 10) {
          const angle1 = calculateAngle(current.start, current.end);
          const angle2 = calculateAngle(candidate.start, candidate.end);
          const angleDiff = Math.abs(((angle1 - angle2 + 180) % 360) - 180);

          if (angleDiff < angleTolerance) {
            // Merge: extend current wall backwards
            current = { start: candidate.start, end: current.end };
            used.add(j);
            extended = true;
            break;
          }
        }
      }
    }

    merged.push(current);
  }

  return merged;
}

