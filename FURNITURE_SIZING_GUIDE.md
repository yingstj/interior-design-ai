# Furniture Sizing & Grid System Guide

## Overview

This application uses a **1-foot grid system** to ensure accurate, proportional furniture placement. All furniture dimensions are stored and rendered in **inches**, then scaled relative to the canvas size.

## How It Works

### 1. **Grid System**
- Grid lines appear every **12 inches (1 foot)**
- Room dimensions are specified in **feet** (e.g., 12' × 15')
- Internal calculations use **inches** for precision
- Canvas scale adjusts to fit the viewport

### 2. **Furniture Dimensions**

#### **Storage Format**
```typescript
{
  name: "Mid-Century Modern Sofa",
  width: 84,   // inches (7 feet)
  depth: 36,   // inches (3 feet)
  price: 1299
}
```

#### **Validation & Normalization**
When furniture is searched or added:
1. **Validates dimensions** are in inches (not cm or feet)
2. **Normalizes** if dimensions seem unrealistic (>200")
3. **Bounds checking**: Min 12" (1ft), Max 120" (10ft)
4. **Logs dimensions** for debugging

### 3. **Canvas Rendering**

#### **Scale Calculation**
```typescript
const roomWidthInches = room.width * 12;     // feet to inches
const roomHeightInches = room.height * 12;
const scale = canvasPixels / roomInches;      // pixels per inch
```

#### **Furniture Rendering**
```typescript
// Visual size on screen
visualWidth = furniture.width * scale;   // inches → pixels
visualHeight = furniture.depth * scale;  // inches → pixels
```

### 4. **Typical Furniture Dimensions**

| Furniture Type | Typical Width | Typical Depth |
|----------------|---------------|---------------|
| **Sofa** | 72-96" (6-8') | 32-38" (2.7-3.2') |
| **Loveseat** | 58-64" (4.8-5.3') | 32-38" (2.7-3.2') |
| **Armchair** | 30-36" (2.5-3') | 32-38" (2.7-3.2') |
| **Coffee Table** | 42-54" (3.5-4.5') | 24-30" (2-2.5') |
| **Dining Table** | 60-96" (5-8') | 36-42" (3-3.5') |
| **Queen Bed** | 60" (5') | 80" (6.7') |
| **King Bed** | 76" (6.3') | 80" (6.7') |
| **Dresser** | 48-60" (4-5') | 18-24" (1.5-2') |
| **Nightstand** | 18-24" (1.5-2') | 16-20" (1.3-1.7') |

## Visual Feedback

### **When Furniture is Selected**
1. **Teal border** becomes thicker (3px)
2. **Dimension label** appears above: "7.0' × 3.0'"
3. **Debug info** logs to console
4. **Add to Cart** button appears

### **Grid Reference**
- Toggle **"Grid"** button to show/hide 1-foot grid
- Toggle **"Ruler"** button to show measurements at edges
- Grid helps verify furniture is proportionally correct

## Debugging Furniture Size Issues

If furniture appears too large or too small:

### **1. Check Console Logs**
When you select a furniture item, look for:
```
📐 Selected furniture: Mid-Century Sofa
  - Dimensions: 84" × 36" (7.0' × 3.0')
  - Position: (120, 80)
  - Scale: 0.75
  - Rendered size: 63px × 27px
```

### **2. Verify Dimensions Make Sense**
- Is `7.0' × 3.0'` reasonable for a sofa? ✅ YES
- Is `20.0' × 15.0'` reasonable for a chair? ❌ NO - likely in cm, not inches

### **3. Compare to Grid**
- Turn on **Grid** view
- A sofa should span **~6-8 grid squares** in width
- A chair should span **~2-3 grid squares** in width
- A coffee table should span **~3-4 grid squares** in width

### **4. Check Scale Factor**
```javascript
// Scale should typically be between 0.5 - 2.0
// If scale is 0.1 or 10, something is wrong with room dimensions
```

## Common Issues & Fixes

### **Issue 1: Furniture appears as huge blocks**
**Cause**: Dimensions might be in cm instead of inches
**Fix**: The app auto-converts > 200" dimensions by dividing by 2.54

### **Issue 2: Furniture is tiny**
**Cause**: Room dimensions too large, or scale incorrect
**Fix**: Check `room.width` and `room.height` are in feet, not inches

### **Issue 3: Image not showing**
**Cause**: SVG data URL encoding issue
**Fix**: Updated to use both `href` and `xlinkHref` attributes

### **Issue 4: Furniture not proportional to grid**
**Cause**: Furniture dimensions not validated
**Fix**: All dimensions now bounded to 12-120 inches (1-10 feet)

## Testing Furniture Dimensions

### **Quick Test Steps:**
1. **Search** for "sofa"
2. **Drag** to canvas
3. **Click** to select
4. **Check console** for dimension log
5. **Enable grid** to verify proportions
6. **Rotate** with 'R' key to test depth
7. **Compare** to grid squares (should be 6-8 squares wide)

### **Expected Console Output:**
```
🪑 Mid-Century Modern Sofa: 84" × 36" (7.0' × 3.0')
📐 Selected furniture: Mid-Century Modern Sofa
  - Dimensions: 84" × 36" (7.0' × 3.0')
  - Rendered size: 126px × 54px
  - Image URL: data:image/svg+xml,%3Csvg%20viewBox...
```

## Architecture Notes

### **Coordinate System**
- Origin (0, 0) = top-left corner of canvas
- X-axis increases to the right
- Y-axis increases downward
- All positions and dimensions in inches

### **SVG Rendering**
- Furniture images are embedded SVG data URLs
- Bird's eye view representations
- Scale proportionally with zoom
- Rotate around center point

### **Scale Independence**
- Furniture dimensions stored in absolute inches
- Rendering adapts to any canvas size
- Zoom in/out maintains proportions
- Export captures exact layout

## Best Practices

1. **Always enable grid** when placing furniture
2. **Select items** to verify dimensions
3. **Use rulers** to measure spacing
4. **Check console** if something looks wrong
5. **Compare** furniture to real-world sizes
6. **Test rotation** to verify depth dimension

---

**Last Updated**: October 30, 2025
**Scale System**: 1 foot = 12 inches per grid square
**Units**: Inches (internal), Feet (display)


