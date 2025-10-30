# Furniture Rendering System

## Overview

The furniture rendering system now displays **custom SVG bird's eye view representations** of furniture pieces instead of random placeholder images.

## How It Works

### 1. **Intelligent Furniture Type Detection**
The system analyzes furniture names to automatically detect the type:
- **Seating**: Sofas, sectionals, chairs, loveseats, ottomans, benches, stools
- **Tables**: Coffee tables, dining tables, side tables, desks, consoles
- **Beds**: Twin, full, queen, king beds
- **Storage**: Dressers, nightstands, bookshelves, wardrobes, cabinets, TV stands
- **Rugs**: Area rugs and carpets

### 2. **SVG Generation**
Each furniture type has a custom SVG representation that shows:
- **Bird's eye (top-down) view** for spatial planning
- **Proper proportions** matching the item's dimensions
- **Visual details** like cushions, drawers, or shelving
- **Color-coded elements** with realistic wood/fabric tones

### 3. **Fallback Strategy**
```
1. Try to use real product image URL (if available from retailer)
2. If unavailable or invalid → Generate SVG representation
3. SVGs are embedded as data URLs (no external requests needed)
```

## Benefits

✅ **Always Relevant** - No more random mountain/nature photos  
✅ **Instant Loading** - SVGs are embedded, no network requests  
✅ **Scalable** - Looks crisp at any zoom level  
✅ **Spatial Accuracy** - Bird's eye view perfect for floor planning  
✅ **Professional** - Consistent, furniture-appropriate visuals  

## Files Modified

- **`utils/furnitureRenderer.ts`** - New utility for SVG generation and type detection
- **`services/geminiService.ts`** - Updated to use SVG renderer as fallback
- **`components/DesignCanvas.tsx`** - Updated to display images properly
- **`App.tsx`** - Updated template furniture to use SVG renderer

## Customization

To add or modify furniture types, edit `utils/furnitureRenderer.ts`:

```typescript
// Add new furniture type to the type union
export type FurnitureType = 'sofa' | 'chair' | 'your-new-type';

// Add detection logic
export function detectFurnitureType(name: string): FurnitureType {
  if (lowerName.includes('your-keyword')) return 'your-new-type';
  // ...
}

// Add SVG rendering case
export function generateFurnitureSVG(type: FurnitureType): string {
  switch (type) {
    case 'your-new-type':
      svg = `<svg>...</svg>`;
      break;
  }
}
```

## Example Output

When you search for "coffee table", you'll now see a proper top-down view showing:
- Rectangular tabletop with rounded corners
- Wood grain texture details
- Visible legs at corners
- Realistic wood color palette

This makes it much easier to visualize how furniture will fit in your space!

