export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  start: Point;
  end: Point;
  thickness: number;
}

export interface Door {
  position: Point;
  width: number;
  swingHinge: Point;
  swingEnd: Point;
}

export interface Window {
  start: Point;
  end: Point;
}

export interface Fixture {
  type: 'toilet' | 'sink' | 'tub' | 'shower' | 'stove' | 'refrigerator' | 'dishwasher' | 'washer' | 'dryer';
  position: Point;
  rotation: number; // 0, 90, 180, 270
  dimensions?: {
    width: number;
    depth: number;
  };
  label?: string; // e.g., "Ref", "DW", "W/D"
}

export interface RoomZone {
  id: string;
  label: string;
  polygon: Point[];
}

export interface FloorPlanAnalysis {
  imageDimensions: {
    width: number;
    height: number;
  };
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: RoomZone[];
  fixtures?: Fixture[]; // Kitchen and bathroom fixtures
  entryDoor?: Point; // Main entrance location for entry arrow
  northAngle?: number; // North direction in degrees (0 = up, 90 = right)
}

export interface FurnitureItem {
  id: string;
  name: string;
  width: number; // in inches
  depth: number; // in inches
  price: number;
  imageUrl: string;
  style: string;
  retailer?: string; // e.g., "West Elm", "CB2"
  productUrl?: string; // Direct link to buy the product
}

export interface PlacedFurnitureItem extends FurnitureItem {
  position: Point; // top-left corner in inches from room origin
  rotation: number; // 0, 90, 180, 270 degrees
}

export interface Room {
  width: number; // in feet
  height: number; // in feet
  floorPlanImage?: string;
  analysis?: FloorPlanAnalysis;
  scaleFtPerPx?: number; // scale in feet per pixel for the floor plan image
}

export interface Suggestion {
  title:string;
  description: string;
  type: 'layout' | 'new_item' | 'decor';
}

export type LoadingState = 'idle' | 'searching' | 'suggesting' | 'analyzing';

export interface AppError {
  message: string;
  type: 'network' | 'ai' | 'validation' | 'storage' | 'unknown';
  timestamp: number;
}

// --- New Types for AI Design Actions ---

// Represents a furniture item as defined by the AI, before it's added to the canvas.
export type NewItemData = Omit<PlacedFurnitureItem, 'id' | 'imageUrl'>;

interface AddAction {
    action: 'add';
    newItemData: NewItemData;
}
interface DeleteAction {
    action: 'delete';
    itemIdToModify: string;
}
interface MoveAction {
    action: 'move';
    itemIdToModify: string;
    newPosition: Point;
}
interface RotateAction {
    action: 'rotate';
    itemIdToModify: string;
    newRotation: number;
}
interface ReplaceAction {
    action: 'replace';
    itemIdToReplace: string;
    newItemData: NewItemData;
}

export type DesignAction = AddAction | DeleteAction | MoveAction | RotateAction | ReplaceAction;

export interface AutoSuggestion {
  description: string;
  action: DesignAction;
}

// --- New Types for Project Management & Cart ---

export interface CartItem extends PlacedFurnitureItem {
  // Currently identical to a placed item, can be extended later
}

export interface Project {
  id: string;
  name: string;
  lastModified: number; // Unix timestamp
  room: Room;
  placedFurniture: PlacedFurnitureItem[];
  stylePreference: string;
  budget: number | undefined;
  cart: CartItem[];
}

// --- New Types for Floor Plan Drawing Mode ---

export type DrawingMode = 'off' | 'draw' | 'view';

export interface DrawnWall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  isTemporary?: boolean; // For walls currently being drawn
}

export interface DrawnDoor {
  id: string;
  type: 'swing' | 'sliding' | 'pocket' | 'bifold';
  position: Point;
  width: number;
  swingHinge: Point;
  swingEnd: Point;
  rotation: number; // 0, 90, 180, 270
}

export interface DrawnWindow {
  id: string;
  type: 'standard' | 'bay';
  start: Point;
  end: Point;
  wallId?: string; // Reference to wall it's placed in
}

export interface DrawnFixture {
  id: string;
  type: Fixture['type'];
  position: Point;
  rotation: number;
  dimensions: {
    width: number;
    depth: number;
  };
  label?: string;
}

export interface DrawnRoomLabel {
  id: string;
  text: string;
  position: Point;
  fontSize: number;
}

export interface DrawnDimension {
  id: string;
  start: Point;
  end: Point;
  label: string; // e.g., "12'3\""
}

export interface DrawnFloorPlan {
  walls: DrawnWall[];
  doors: DrawnDoor[];
  windows: DrawnWindow[];
  fixtures: DrawnFixture[];
  roomLabels: DrawnRoomLabel[];
  dimensions: DrawnDimension[];
}

export type DrawingTool = 
  | 'select'
  | 'wall'
  | 'door-swing'
  | 'door-sliding'
  | 'door-pocket'
  | 'door-bifold'
  | 'window'
  | 'window-bay'
  | 'fixture-toilet'
  | 'fixture-sink'
  | 'fixture-tub'
  | 'fixture-shower'
  | 'fixture-stove'
  | 'fixture-refrigerator'
  | 'fixture-dishwasher'
  | 'fixture-washer'
  | 'fixture-dryer'
  | 'room-label'
  | 'dimension';
