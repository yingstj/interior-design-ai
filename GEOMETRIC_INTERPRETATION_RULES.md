# Geometric Interpretation Rules - Floor Plan Analysis

## Overview

These rules ensure Claude AI interprets floor plans with **architectural precision**, avoiding common errors like treating fixtures as walls, misinterpreting patterns, or tracing text boxes.

## 🎯 Core Principle: Strict Layer Hierarchy

**The AI processes floor plans in a strict top-down hierarchy:**

```
1️⃣  STRUCTURAL WALLS (Top Priority)
    ↓
2️⃣  OPENINGS (Doors & Windows)
    ↓
3️⃣  FIXTURES & APPLIANCES (Contained Objects)
    ↓
4️⃣  TEXT & ANNOTATIONS (Read Only, Never Trace)
```

### **Non-Destructive Layering**

**Rule**: Elements in **lower layers** must **NEVER** modify or obscure geometry in **higher layers**.

**Example**:
- ✅ **Correct**: Walls traced first → Fixtures placed inside wall boundaries
- ❌ **Wrong**: Fixture outline traced as wall → Room boundaries distorted

---

## 📐 Layer 1: Structural Walls (Highest Priority)

### **What to Trace**
- **Thick solid lines** = Structural/exterior walls
- **Thin lines** = Interior partitions
- **ALL continuous line segments** that form room boundaries

### **What NOT to Trace**
- ❌ Fixture outlines (refrigerator, tub, toilet)
- ❌ Text bounding boxes
- ❌ Tile/texture patterns (hatch marks, dots)
- ❌ Furniture silhouettes
- ❌ Appliance edges

### **Common Mistakes to Avoid**

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| Tracing refrigerator outline as wall | Trace only the kitchen perimeter walls |
| Tracing bathtub edge as wall | Trace only the bathroom walls |
| Tracing tile pattern as partition | Ignore tile hatching completely |

---

## 🚪 Layer 2: Openings (Doors & Windows)

### **Doors**
- **Look for**: Straight line + curved arc (quarter circle)
- **Place in**: Wall breaks/openings
- **Arc represents**: Door swing path when opening

### **Windows**
- **Look for**: Breaks in thick wall lines + parallel thin lines
- **Place in**: Exterior wall gaps
- **Thin lines represent**: Window glass/frame

### **Key Rule**
Openings are **placed in walls**, not **defined by** walls. First trace all walls, then identify openings within those walls.

---

## 🛁 Layer 3: Fixtures & Appliances (Contained Objects)

### **Critical Rule: Fixtures Are NOT Walls**

**All fixtures are CONTAINED OBJECTS within room boundaries:**

- Toilet
- Bathtub
- Sink
- Shower
- Refrigerator
- Stove/Range
- Dishwasher
- Washer/Dryer

### **Fixture Placement Rules**

1. **Containment**: Every fixture MUST be fully contained within ONE continuous room boundary
2. **Non-Intersection**: Fixtures may **touch** walls but **NEVER intersect** wall edges
3. **Not Structural**: Fixture outlines are **NEVER** traced as wall segments
4. **Not Divisive**: Fixtures **DO NOT** create room divisions

### **Fixture Containment Rule**

**If a fixture appears to cross or touch multiple walls:**

❌ **Wrong**: Split the room into two polygons
✅ **Correct**: Reclassify room boundaries to ENCLOSE the fixture in a single space

**Example**:
```
❌ WRONG:
- Bathroom split into "Toilet Area" and "Shower Area" because toilet touches 2 walls

✅ CORRECT:
- Bathroom is ONE polygon containing toilet, shower, sink
- All fixtures are INSIDE the bathroom boundary
```

### **Common Fixture Errors**

| Error | Why It's Wrong | Correct Approach |
|-------|---------------|------------------|
| Tracing tub outline as wall | Tub is a fixture, not structure | Place tub inside bathroom polygon |
| Using refrigerator edge to define room | Appliances don't create boundaries | Trace kitchen walls, place fridge inside |
| Creating separate polygon for toilet | Fixtures don't divide rooms | Include toilet in bathroom polygon |
| Tracing W/D units as partition | Appliances are contained objects | Place W/D inside laundry/closet area |

---

## 🚫 What to Ignore Completely

### **1. Surface Patterns (Textures)**

**Ignore these visual patterns:**

| Pattern Type | Appears As | What It Represents | Action |
|-------------|-----------|-------------------|--------|
| **Hatch marks** | Diagonal lines in rectangles | Tile floors (bathroom/kitchen) | **IGNORE** |
| **Dot patterns** | Small repeated dots | Balcony/terrace texture | **IGNORE** |
| **Cross-hatching** | Crossed diagonal lines | Material fill (concrete, stone) | **IGNORE** |
| **Stippling** | Dense dots | Outdoor surfaces | **IGNORE** |

**Key Point**: These are **decorative fills**, not architectural geometry. They represent materials/textures, **NOT** walls or partitions.

### **2. Text Bounding Boxes**

**Ignore outlines around text labels:**

- Room names have invisible bounding boxes → **IGNORE**
- Dimensions have text boxes → **IGNORE**
- Labels may overlap walls/fixtures → **IGNORE the box, read the text**

**Example**:
```
❌ WRONG:
"Living Room" label has a rectangle around it → Trace rectangle as geometry

✅ CORRECT:
"Living Room" label → Read text, ignore bounding box
```

### **3. Furniture Silhouettes**

Some marketing floor plans show furniture (sofa, bed, table):
- **DO NOT** trace furniture as walls
- **DO NOT** confuse furniture with fixtures
- Focus only on architectural elements (walls, doors, windows, built-in fixtures)

---

## ✅ Fixture Containment Examples

### **Example 1: Bathroom**

**Layout**:
- Toilet in corner (touches 2 walls)
- Bathtub along one wall
- Sink on vanity counter

**❌ Wrong Interpretation**:
```json
{
  "rooms": [
    {"id": "toilet-area", "polygon": [...]},
    {"id": "tub-area", "polygon": [...]},
    {"id": "vanity-area", "polygon": [...]}
  ]
}
```
**Problem**: Split bathroom into 3 rooms based on fixtures

**✅ Correct Interpretation**:
```json
{
  "rooms": [
    {"id": "bathroom", "label": "Bathroom", "polygon": [...]} 
  ],
  "fixtures": [
    {"type": "toilet", "position": {...}},
    {"type": "tub", "position": {...}},
    {"type": "sink", "position": {...}}
  ]
}
```
**Solution**: ONE bathroom polygon containing all fixtures

---

### **Example 2: Kitchen**

**Layout**:
- Refrigerator in corner (large rectangle labeled "Ref")
- Stove on wall (circles for burners)
- Dishwasher next to sink (labeled "DW")

**❌ Wrong Interpretation**:
- Trace refrigerator outline as wall segment
- Use appliance edges to define kitchen polygon

**✅ Correct Interpretation**:
- Trace kitchen perimeter walls FIRST
- Place refrigerator, stove, dishwasher as fixtures INSIDE kitchen polygon
- Fixtures do not modify kitchen boundary

---

### **Example 3: Laundry**

**Layout**:
- Washer and Dryer side-by-side in closet (labeled "W/D")

**❌ Wrong Interpretation**:
```json
{
  "walls": [
    {"start": {...}, "end": {...}}, // Traced W/D outline as wall
  ]
}
```

**✅ Correct Interpretation**:
```json
{
  "walls": [
    {"start": {...}, "end": {...}} // Closet walls only
  ],
  "fixtures": [
    {"type": "washer", "position": {...}, "label": "W"},
    {"type": "dryer", "position": {...}, "label": "D"}
  ]
}
```

---

## 🔍 Quality Checks (Before Returning JSON)

### **Layer Hierarchy Check**

✅ Did I trace walls FIRST?
✅ Did I place doors/windows in wall breaks SECOND?
✅ Did I identify fixtures THIRD (as contained objects)?
✅ Did I ignore text bounding boxes COMPLETELY?

### **Fixture Check**

✅ Are ALL fixtures INSIDE room polygons (not on boundaries)?
✅ Did I avoid tracing any fixture outline as a wall?
✅ Did I avoid using fixture edges to define room polygons?
✅ Are all fixtures in the `fixtures` array (not as walls)?

### **Pattern Ignore Check**

✅ Did I ignore tile hatch marks in bathrooms/kitchens?
✅ Did I ignore dot patterns on balconies?
✅ Did I ignore diagonal fill patterns in rooms?

### **Text Ignore Check**

✅ Did I read text labels but ignore their bounding boxes?
✅ Did I avoid tracing any text outline as geometry?

### **Room Containment Check**

✅ Is each fixture fully contained in ONE room?
✅ If a fixture touches multiple walls, did I keep it in ONE room polygon?
✅ Did I avoid splitting rooms based on fixture placement?

---

## 🎓 Learning from Common Errors

### **Error 1: Tracing Bathtub as Wall**

**Symptom**: Bathroom appears as two separate rooms
**Cause**: Bathtub outline traced as interior partition
**Fix**: Remove bathtub outline from walls array, add to fixtures array

### **Error 2: Tile Pattern Misinterpreted as Partition**

**Symptom**: Extra walls in bathroom/kitchen that shouldn't exist
**Cause**: Hatch marks interpreted as structural lines
**Fix**: Ignore all repetitive patterns, trace only continuous thick/thin lines

### **Error 3: Text Box Traced as Geometry**

**Symptom**: Small rectangular "room" where label appears
**Cause**: Text bounding box traced as wall
**Fix**: Read text content only, never trace text outlines

### **Error 4: Refrigerator Defines Room Boundary**

**Symptom**: Kitchen polygon has irregular shape matching appliance
**Cause**: Using fixture edges to define room polygon
**Fix**: Trace kitchen walls first (ignoring appliances), then place fixtures inside

### **Error 5: Fixture Crosses Multiple Rooms**

**Symptom**: Toilet appears in both "Bathroom" and "Toilet Area" polygons
**Cause**: Split room into multiple polygons based on fixture placement
**Fix**: Create ONE room polygon that contains all fixtures

---

## 📊 Before & After Example

### **Before (With Errors)**

```json
{
  "walls": [
    {"start": {"x": 100, "y": 100}, "end": {"x": 200, "y": 100}},
    {"start": {"x": 150, "y": 110}, "end": {"x": 150, "y": 150}},  ← WRONG: Bathtub outline
    {"start": {"x": 300, "y": 200}, "end": {"x": 350, "y": 200}}   ← WRONG: Text box
  ],
  "rooms": [
    {"id": "bathroom-1", "label": "Bath Area 1", "polygon": [...]},  ← WRONG: Split room
    {"id": "bathroom-2", "label": "Bath Area 2", "polygon": [...]}   ← WRONG: Split room
  ]
}
```

### **After (Corrected)**

```json
{
  "walls": [
    {"start": {"x": 100, "y": 100}, "end": {"x": 200, "y": 100}}  ← CORRECT: Wall only
  ],
  "fixtures": [
    {"type": "tub", "position": {"x": 150, "y": 130}, ...}  ← CORRECT: Fixture inside room
  ],
  "rooms": [
    {"id": "bathroom", "label": "Bathroom", "polygon": [...]}  ← CORRECT: ONE room
  ]
}
```

---

## 🚀 Implementation in Code

These rules are enforced in the Claude API prompt (`server/index.js`):

```javascript
// STEP 3 - GEOMETRIC INTERPRETATION RULES (CRITICAL FOR ACCURACY)

⚠️  STRICT LAYER HIERARCHY - NEVER VIOLATE THIS ORDER:
1️⃣  STRUCTURAL WALLS (TOP PRIORITY - trace first, never modify)
2️⃣  OPENINGS (doors/windows - place in wall breaks)
3️⃣  FIXTURES & APPLIANCES (contained objects - never trace as walls)
4️⃣  TEXT & ANNOTATIONS (ignore outlines completely)

// ... (full rules in prompt)
```

---

## 📝 Summary

**Key Takeaways**:

1. ✅ **Trace walls FIRST** → Place openings SECOND → Identify fixtures THIRD → Ignore text boxes
2. ✅ **Fixtures are contained objects**, never structural elements
3. ✅ **Ignore patterns** (tile, dots, hatching) - they're textures, not geometry
4. ✅ **Ignore text bounding boxes** - read text, never trace outlines
5. ✅ **One fixture = One room** - never split rooms based on fixture placement

**Result**: Accurate, architecturally-correct floor plan analysis that matches real-world conventions! 🎉

