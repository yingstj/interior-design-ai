# Floor Plan Drawing Mode - Documentation

## Overview

The Interior Design AI app now supports **creating floor plans from scratch** using the same standardized architectural elements that the AI recognizes when analyzing uploaded plans. This ensures complete consistency between analyzed and created plans.

## Features

### ✨ **Core Capabilities**

1. **Interactive Drawing Canvas**
   - Drag-and-place architectural elements on a blank canvas
   - Real-time visual feedback during drawing
   - Grid-snapping for precise placement
   - Crosshair cursor for accurate positioning

2. **Architectural Element Palette**
   - **Structure**: Walls
   - **Openings**: Swing doors, sliding doors, pocket doors, bifold doors, windows, bay windows
   - **Fixtures**: Kitchen (refrigerator, stove, dishwasher, sink), bathroom (toilet, tub, shower, sink), laundry (washer, dryer)
   - **Annotations**: Room labels, dimensions

3. **Smart Architectural Behaviors**
   - **Walls**: Automatically snap to 90° angles (horizontal/vertical)
   - **Doors**: Auto-generate swing arcs showing opening direction
   - **Windows**: Place in wall breaks with proper architectural representation
   - **Fixtures**: Standard sizes with rotation support
   - **Snap-to-grid**: All elements align to 10-pixel grid for precision
   - **Wall-to-wall snapping**: Endpoint snapping for connected walls

4. **Live Dimension Display**
   - Real-time measurements in feet and inches (e.g., "12'3\"")
   - Helvetica font for architectural consistency
   - Centered text labels
   - Dimension lines with endpoints

5. **Metadata Compatibility**
   - Drawn plans export to identical `FloorPlanAnalysis` structure
   - Seamless integration with furniture placement engine
   - AI layout suggestions work with drawn plans
   - Validation checks for architectural correctness

## Usage

### **Activating Drawing Mode**

1. Click the **"Draw Floor Plan"** button in the header
2. The left sidebar switches to the **Architectural Palette**
3. The center canvas becomes an **interactive drawing surface**

### **Drawing Workflow**

1. **Select a Tool**: Click an element from the palette (e.g., "Wall")
2. **Draw**: Click-and-drag on the canvas to place the element
3. **Repeat**: Select and place additional elements
4. **Done**: Click **"Done Drawing"** to finalize the floor plan

### **Smart Behaviors in Action**

#### **Walls**
- Click-and-drag to draw a wall
- As you drag, the wall automatically snaps to horizontal or vertical
- Release to finalize the wall
- New walls snap to endpoints of existing walls for seamless connections

#### **Doors**
- Click near a wall to place a door
- The door automatically positions itself in the wall
- A swing arc is auto-generated showing the opening direction
- Default width: 3 feet (standard interior door)

#### **Windows**
- Click near a wall to place a window
- The window creates a break in the wall line
- Glass is represented by parallel thin lines
- Default width: 3 feet

#### **Fixtures**
- Click anywhere to place a fixture (toilet, sink, stove, etc.)
- Fixtures show as rectangles with labels (e.g., "Ref" for refrigerator)
- Standard architectural sizes are pre-set
- Click to rotate fixtures (0°, 90°, 180°, 270°)

#### **Room Labels**
- Click to place a label
- Edit the text to name the room (e.g., "Living Room", "Bedroom (12'3\"x9'1\")")
- Font size: 16px Helvetica
- Centered text alignment

#### **Dimensions**
- Click-and-drag to create a dimension line
- The dimension automatically calculates and displays the distance in feet/inches
- Endpoint markers show measurement start/end
- Dimension text appears centered above the line

### **Drawing Controls**

Located in the left sidebar below the palette:

- **Element Count**: Real-time count of walls, doors, windows, and fixtures
- **Clear All**: Remove all drawn elements and start over

### **Exiting Drawing Mode**

Click **"Done Drawing"** to:
1. Convert the drawn plan to `FloorPlanAnalysis` format
2. Validate architectural correctness (warnings logged to console)
3. Switch back to design mode with furniture placement
4. Use the drawn floor plan just like an uploaded/analyzed one

## Technical Architecture

### **File Structure**

```
components/
  ArchitecturalPalette.tsx    # Drawing tools palette UI
  DrawingCanvas.tsx            # Interactive drawing canvas
  
utils/
  architecturalDrawing.ts      # Smart behaviors (snapping, arc generation, etc.)
  floorPlanConverter.ts        # Export to FloorPlanAnalysis format
  
types.ts                       # Extended with drawing mode types
App.tsx                        # Integrated drawing mode state & UI
```

### **Key Types**

```typescript
// Drawing mode state
type DrawingMode = 'off' | 'draw' | 'view';

// Drawn elements (in-progress)
interface DrawnFloorPlan {
  walls: DrawnWall[];
  doors: DrawnDoor[];
  windows: DrawnWindow[];
  fixtures: DrawnFixture[];
  roomLabels: DrawnRoomLabel[];
  dimensions: DrawnDimension[];
}

// Conversion to standard format
FloorPlanAnalysis = convertDrawnPlanToAnalysis(DrawnFloorPlan)
```

### **Architectural Constants**

```typescript
WALL_THICKNESS = 6px           // ~6 inches at typical scale
SNAP_ANGLE_THRESHOLD = 15°     // Angular tolerance for 90° snap
SNAP_DISTANCE_THRESHOLD = 20px // Proximity for endpoint snapping
GRID_SIZE = 10px               // Grid spacing for alignment
```

### **Smart Behavior Functions**

- `snapToGrid(point)`: Align point to grid intersections
- `snapWallTo90Degrees(start, end)`: Force horizontal/vertical
- `snapToWalls(point, walls)`: Magnetic endpoint snapping
- `generateDoorSwingArc(position, width, rotation)`: Auto-generate door arcs
- `findNearestWall(point, walls)`: Identify closest wall for opening placement
- `calculateDimension(start, end, scale)`: Format measurements in feet/inches

## Architectural Conventions

The drawing mode follows the **same standards** the AI uses for analysis:

### **Visual Representation**

| Element | Appearance | Behavior |
|---------|-----------|----------|
| **Walls** | Thick black lines | Snap to 90°, endpoint magnetic snapping |
| **Doors** | Straight line + arc | Arc shows swing direction (quarter circle) |
| **Windows** | Break in wall + thin parallel lines | Place in wall gaps, glass representation |
| **Fixtures** | Rectangles with labels | Standard sizes, rotatable |
| **Room Labels** | Bold Helvetica text | Centered, editable |
| **Dimensions** | Dashed line + measurement | Auto-calculated feet/inches |

### **Architectural Standards**

1. **Doors**: Interior = 30-36", exterior = 36", closet = 24-30"
2. **Windows**: Standard = 36", bay = 72-96"
3. **Walls**: Structural = 6" thick (standard residential)
4. **Fixtures**: 
   - Refrigerator: 36"×30"
   - Stove: 30"×30"
   - Dishwasher: 24"×24"
   - Toilet: 24"×30"
   - Bathtub: 60"×30"
   - Shower: 36"×36"
   - Washer/Dryer: 27"×27" each

## Validation & Quality Checks

When exiting drawing mode, the system validates:

✓ **Structural Completeness**
- Minimum 1 room defined
- Walls form connected structures
- No extremely short walls (< 10px)

✓ **Architectural Correctness**
- Doors have proper swing arcs
- Windows are placed in walls
- Fixtures are not overlapping walls

✓ **Metadata Integrity**
- Image dimensions defined
- Room polygons properly traced
- All required fields present

**Warnings** (logged to console, not blocking):
- Missing doors or windows
- Disconnected wall groups
- Rooms without labels

## Integration with Existing Features

### **After Drawing a Floor Plan**

Once you click "Done Drawing", the drawn plan becomes a **fully integrated floor plan** that supports:

1. ✅ **Furniture Placement**: Drag furniture onto the drawn floor plan
2. ✅ **AI Suggestions**: Get layout recommendations based on your drawn rooms
3. ✅ **Auto-Design**: Use AI to furnish rooms in your drawn plan
4. ✅ **Shopping Cart**: Purchase furniture for your custom floor plan
5. ✅ **Project Saving**: Save and reload projects with drawn floor plans

### **Switching Between Modes**

- **Drawing → Design**: Automatically converts drawn elements to analysis format
- **Design → Drawing**: Preserves existing floor plan data
- **Clear Drawing**: Removes floor plan but keeps furniture

## Future Enhancements

Potential additions:

- **Element Editing**: Click to edit/delete individual elements
- **Undo/Redo**: Drawing-specific history management
- **Room Polygon Auto-Detection**: Automatically trace room boundaries from walls
- **Import/Export**: Save/load drawing files in custom format
- **Multi-Level Plans**: Support for multiple floors
- **Curved Walls**: Beyond 90° snapping
- **Advanced Fixtures**: Cabinets, counters, built-ins

## Keyboard Shortcuts (Future)

- `Esc`: Cancel current drawing action
- `Delete`: Remove selected element
- `Ctrl+Z`: Undo last action
- `Ctrl+Y`: Redo last action
- `W`: Select Wall tool
- `D`: Select Door tool
- `Shift+Drag`: Disable snapping temporarily

## Troubleshooting

### **Issue**: Walls won't snap to 90°
**Solution**: Ensure you're dragging far enough from the start point (> 50px)

### **Issue**: Doors/windows not placing in walls
**Solution**: Click closer to a wall (within 50px proximity)

### **Issue**: Elements not snapping to grid
**Solution**: Grid snapping is always enabled. Check that you're releasing the mouse button.

### **Issue**: Drawn plan doesn't show after clicking "Done Drawing"
**Solution**: Ensure you've drawn at least one wall or door before exiting

## Examples

### **Basic Room Drawing Sequence**

1. Click "Draw Floor Plan"
2. Select "Wall" → Draw 4 walls to form a rectangle
3. Select "Swing Door" → Click on one wall to add entry
4. Select "Window" → Click on another wall to add window
5. Select "Room Label" → Click center, type "Living Room (15'×12')"
6. Click "Done Drawing"
7. ✅ Floor plan is ready for furniture placement!

### **Kitchen Layout**

1. Draw perimeter walls
2. Add door for entry
3. Place "Refrigerator" in corner
4. Place "Stove" on wall
5. Place "Dishwasher" next to stove
6. Add windows above counters
7. Label "Kitchen (10'×8')"

## API Reference

### **Drawing Mode Handlers**

```typescript
handleToggleDrawingMode()     // Enter/exit drawing mode
handleDrawnPlanUpdate(plan)   // Update drawn elements
handleClearDrawnPlan()        // Clear all drawn elements
```

### **Conversion Functions**

```typescript
convertDrawnPlanToAnalysis(
  drawnPlan: DrawnFloorPlan,
  width: number,
  height: number
): FloorPlanAnalysis

validateFloorPlan(
  analysis: FloorPlanAnalysis
): { isValid: boolean; errors: string[]; warnings: string[] }
```

### **Architectural Utilities**

```typescript
snapToGrid(point: Point): Point
snapWallTo90Degrees(start: Point, end: Point): Point
generateDoorSwingArc(position: Point, width: number, rotation: number): Arc
calculateDimension(start: Point, end: Point, scale: number): string
```

---

**🎉 You can now create professional floor plans from scratch, with the same precision and standards used by architectural AI analysis!**

