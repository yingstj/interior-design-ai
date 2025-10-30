# Floor Plan Testing Guide

## Overview

This guide provides comprehensive instructions for testing the floor plan analysis feature with diverse architectural styles, scales, and qualities.

---

## Testing Objectives

1. **Validate Detection Accuracy**: Ensure doors, windows, and fixtures are correctly identified
2. **Test Diverse Styles**: Verify performance across different architectural styles
3. **Assess Scale Handling**: Test various image sizes and quality levels
4. **Identify Edge Cases**: Find and document failure modes
5. **Iterate on Prompts**: Improve AI prompts based on test results

---

## Test Image Requirements

### 10-20 Diverse Floor Plans

#### **Architectural Styles** (Test at least 2 of each):
1. **Modern/Contemporary** - Open floor plans, minimal walls, large windows
2. **Traditional** - Defined rooms, standard layouts, conventional features
3. **Victorian/Historic** - Complex layouts, many small rooms, ornate details
4. **Apartment/Condo** - Compact spaces, efficient layouts, typical urban designs
5. **Commercial** - Offices, retail spaces, non-residential layouts

#### **Scales & Quality Levels**:
- **High Resolution** (2000+ pixels): Professional architectural drawings
- **Medium Resolution** (1000-2000 pixels): Standard scanned plans
- **Low Resolution** (<1000 pixels): Photos of printed plans, lower quality
- **Different File Formats**: PNG (best), JPEG (compressed)
- **Various Sizes**: <500KB, 500KB-2MB, 2MB-5MB

#### **Plan Types**:
- **Single-family homes**: 2-4 bedrooms, 1-2 bathrooms
- **Apartments**: Studios, 1BR, 2BR, 3BR
- **Multi-story**: Plans showing multiple floors
- **Detailed plans**: With dimensions, labels, symbols
- **Simple plans**: Basic outlines without annotations

---

## Testing Procedure

### Step 1: Prepare Test Images

Create a folder with 10-20 floor plan images organized by category:

```
test-images/
├── modern/
│   ├── modern-apartment-2br.png
│   ├── modern-house-3br.jpg
│   └── ...
├── traditional/
│   ├── traditional-house-4br.png
│   └── ...
├── historic/
│   ├── victorian-3br.png
│   └── ...
├── compact/
│   ├── studio-apartment.png
│   └── ...
└── commercial/
    ├── office-layout.png
    └── ...
```

### Step 2: Create a Testing Spreadsheet

Track results for each test image:

| Image Name | Style | Resolution | File Size | Upload Time | Analysis Time | Walls | Doors | Windows | Fixtures | Rooms | Notes |
|------------|-------|------------|-----------|-------------|---------------|-------|-------|---------|----------|-------|-------|
| modern-apt-2br.png | Modern | 1920x1080 | 1.2MB | 2s | 45s | 65 | 12 | 8 | 5 | 6 | ✅ Excellent |
| traditional-3br.jpg | Traditional | 1024x768 | 800KB | 1s | 38s | 48 | 8 | 6 | 4 | 5 | ⚠️ Missed 2 closet doors |

### Step 3: Testing Each Image

For each test image:

1. **Upload the floor plan** through the Control Panel
2. **Observe the loading state**:
   - Note the elapsed time shown in the UI
   - Watch the progress bar and status messages
   - Check if the 30-90 second estimate is accurate
3. **Wait for analysis to complete**
4. **Check the Detection Metrics panel**:
   - Expand the metrics panel
   - Review the counts for walls, doors, windows, fixtures, rooms
   - Note any quality warnings (red/yellow indicators)
5. **Visually inspect the rendered floor plan**:
   - Are all doors showing swing arcs?
   - Are all windows showing double-line representation?
   - Are fixtures rendered with correct symbols?
   - Are room labels accurate?
6. **Copy metrics to clipboard** and paste into your spreadsheet
7. **Take a screenshot** of the rendered result for comparison
8. **Log any issues**:
   - Missed doors/windows/fixtures
   - Incorrect room labels
   - Rendering artifacts
   - Performance issues

### Step 4: Compare Results

For each image, manually count the actual architectural elements:

1. **Count doors** (look for door swings in the original image)
2. **Count windows** (look for window symbols on exterior walls)
3. **Count fixtures** (toilets, sinks, stoves, refrigerators, etc.)
4. **Count rooms** (distinct labeled spaces)

Compare detected counts vs. actual counts:
- **Accuracy Rate** = (Detected / Actual) × 100%
- **Target**: >90% accuracy for doors and windows, >80% for fixtures

### Step 5: Analyze Patterns

Look for patterns in failures:
- **Low-resolution images**: Do they consistently miss details?
- **Compressed JPEGs**: Are they harder to analyze than PNGs?
- **Complex layouts**: Do Victorian/historic plans have lower accuracy?
- **Specific features**: Are certain fixture types always missed (e.g., dishwashers)?
- **Labeling**: Are abbreviated labels (CL, DW, W/D) correctly interpreted?

---

## Expected Metrics by Plan Type

### Typical 2-Bedroom Apartment (800-1000 sq ft)
- **Walls**: 40-60 segments
- **Doors**: 8-12 (entry, 2 bedrooms, bathroom, 2-4 closets, balcony)
- **Windows**: 5-10 (living room 2-3, bedrooms 2-3, kitchen 1-2)
- **Fixtures**: 4-7 (kitchen: ref, stove, DW, sink; bathroom: toilet, tub, sink)
- **Rooms**: 5-7 (living, dining, 2 bedrooms, bathroom, kitchen, balcony)

### Typical 3-Bedroom House (1500-2000 sq ft)
- **Walls**: 70-100 segments
- **Doors**: 12-18 (entry, 3 bedrooms, 2 bathrooms, 4-6 closets, garage, back door)
- **Windows**: 10-18 (multiple per room, plus garage)
- **Fixtures**: 6-12 (2 bathrooms, kitchen, laundry room)
- **Rooms**: 8-12 (living, dining, kitchen, 3 bedrooms, 2 bathrooms, laundry, garage)

### Studio Apartment (400-600 sq ft)
- **Walls**: 20-35 segments
- **Doors**: 4-6 (entry, bathroom, 1-2 closets)
- **Windows**: 2-5 (1-2 per wall)
- **Fixtures**: 3-5 (kitchen, bathroom)
- **Rooms**: 3-4 (main room, bathroom, kitchen area)

---

## Detection Quality Guidelines

### ✅ Excellent (90-100% accuracy)
- All major doors detected with correct swing arcs
- All windows on exterior walls detected
- All major fixtures (toilet, sink, stove, refrigerator) detected
- All rooms correctly labeled

### ⚠️ Good (70-89% accuracy)
- Most doors detected, may miss 1-2 closet doors
- Most windows detected, may miss small bathroom windows
- Major fixtures detected, may miss dishwasher or labels
- Rooms mostly correct, may combine small spaces

### ⚠️ Fair (50-69% accuracy)
- Some doors/windows missed
- Several fixtures missing or incorrect
- Room labels may be inaccurate or missing
- May need prompt iteration

### ❌ Poor (<50% accuracy)
- Many architectural elements missed
- Incorrect room detection
- Major analysis failures
- Requires investigation and prompt refinement

---

## Common Issues & Solutions

### Issue: Low Door Count (< 5 doors detected)

**Possible Causes**:
- Image quality too low
- Door arcs not clearly visible
- Complex/non-standard door symbols
- AI prompt needs refinement

**Solutions**:
1. Try higher resolution image
2. Check if original plan uses non-standard door notation
3. Review and enhance the door detection prompt in `server/index.js` and `services/geminiService.ts`
4. Add explicit examples of door types to the prompt

### Issue: Low Window Count (< 3 windows detected)

**Possible Causes**:
- Windows drawn as simple gaps, not standard symbols
- Confused with doors or other openings
- Interior vs. exterior wall confusion

**Solutions**:
1. Clarify exterior wall detection in prompts
2. Add clearer distinction between doors and windows
3. Emphasize the "parallel lines" window representation
4. Test with plans that use standard architectural symbols

### Issue: Missing Fixtures

**Possible Causes**:
- Fixtures not labeled (no "Ref", "DW", etc.)
- Non-standard fixture symbols
- Fixtures drawn too small or unclear

**Solutions**:
1. Enhance fixture detection to recognize symbols even without labels
2. Add more fixture symbol examples to the prompt
3. Include dimension-based hints (e.g., "30x30 inch square in kitchen = likely stove")

### Issue: Incorrect Room Labels

**Possible Causes**:
- Room labels not present in original image
- Labels are abbreviations or unclear
- AI guessing based on fixtures/layout

**Solutions**:
1. Verify original plan has clear room labels
2. Add common abbreviation mappings to prompt (BR = Bedroom, LR = Living Room)
3. Use fixture context (toilet = bathroom, stove = kitchen)

### Issue: Analysis Takes Too Long (>90 seconds)

**Possible Causes**:
- Very high resolution image (>5MB)
- Very complex floor plan
- Backend server performance
- Network latency

**Solutions**:
1. Compress images before upload (target 1-2MB)
2. Use PNG instead of JPEG for better compression-quality balance
3. Check backend server logs for performance bottlenecks
4. Consider caching or progressive analysis

---

## Prompt Iteration Process

If you find consistent issues with specific detection types:

### 1. Identify the Pattern
- Which element type has low accuracy? (doors/windows/fixtures)
- Is it specific to certain plan types or styles?
- Are there visual patterns the AI is missing?

### 2. Locate the Prompts
- **Claude (primary)**: `server/index.js` lines 183-243
- **Gemini (fallback)**: `services/geminiService.ts` lines 408-506

### 3. Enhance the Prompts

**For doors**, add more specific guidance:
```
DOOR DETECTION CRITICAL IMPROVEMENTS:
• Quarter-circle arcs are ALWAYS doors
• Every bedroom MUST have a door
• Bathrooms ALWAYS have doors
• Look for door symbols in ALL walls (interior and exterior)
• Count expected: 2BR = 8-12 doors, 3BR = 12-18 doors
• If count < 8, SCAN AGAIN
```

**For windows**, add more visual cues:
```
WINDOW DETECTION ENHANCEMENTS:
• Windows = gaps in walls + parallel lines
• Check EVERY exterior wall for breaks
• Living rooms typically have 2-4 windows
• Bedrooms have at least 1 window each
• If no windows found in a room, look for wall breaks
```

**For fixtures**, add symbol descriptions:
```
FIXTURE SYMBOL LIBRARY:
• Toilet: Circle (bowl) + small rectangle (tank behind)
• Sink: Oval or circle inside rectangle (counter)
• Bathtub: Long rectangle (60-72") with small circle (drain)
• Shower: Square (36-48") with X or grid pattern
• Stove/Range: Square (30") with 4 circles (burners)
• Refrigerator: Large rectangle (36"x30") often labeled "Ref"
• Dishwasher: Rectangle (24"x24") often labeled "DW" or "D/W"
```

### 4. Test Prompt Changes

After modifying prompts:
1. Restart backend server (`npm run server`)
2. Re-test with 3-5 floor plans that had issues
3. Compare new metrics to previous results
4. Document improvements or regressions
5. Iterate until accuracy targets are met

### 5. Document Changes

Keep a changelog of prompt iterations:
```
2025-10-30: Enhanced door detection with explicit room-by-room requirements
  - Added expected door counts for 2BR/3BR apartments
  - Result: Door detection improved from 65% to 85% accuracy

2025-10-30: Added fixture symbol library with visual descriptions
  - Detailed each fixture type's appearance
  - Result: Fixture detection improved from 70% to 88% accuracy
```

---

## Test Data Collection Template

Save this as a CSV for easy tracking:

```csv
Test_ID,Image_Name,Style,Resolution,File_Size_MB,Upload_Time_s,Analysis_Time_s,Walls_Detected,Doors_Detected,Doors_Actual,Windows_Detected,Windows_Actual,Fixtures_Detected,Fixtures_Actual,Rooms_Detected,Rooms_Actual,Door_Accuracy_%,Window_Accuracy_%,Fixture_Accuracy_%,Overall_Quality,Notes
1,modern-apt-2br.png,Modern,1920x1080,1.2,2,45,65,12,14,8,9,5,6,6,7,86,89,83,Good,"Missed 2 closet doors, 1 small bathroom window"
2,traditional-3br.jpg,Traditional,1024x768,0.8,1,38,48,8,12,6,8,4,6,5,6,67,75,67,Fair,"Low resolution affected detection"
3,victorian-3br.png,Historic,2400x1800,2.8,3,72,92,15,16,12,14,8,9,9,10,94,86,89,Excellent,"Complex layout handled well"
```

---

## Performance Benchmarks

Track system performance across tests:

| Metric | Target | Notes |
|--------|--------|-------|
| **Upload Time** | <5s | Should be near-instant for images <5MB |
| **Analysis Time** | 30-90s | Varies by image complexity and resolution |
| **Progress Accuracy** | ±10s | Progress bar should reflect actual time remaining |
| **Detection Accuracy** | >85% | For doors, windows, major fixtures |
| **Memory Usage** | <500MB | Monitor browser memory during analysis |
| **Backend CPU** | <80% | Check server CPU during analysis |

---

## Success Criteria

A successful test suite should demonstrate:

1. **✅ Consistent Performance**: Analysis completes in 30-90 seconds for 90%+ of tests
2. **✅ High Accuracy**: >85% detection rate for doors and windows across diverse plans
3. **✅ Fixture Detection**: >80% accuracy for kitchen and bathroom fixtures
4. **✅ Scale Handling**: Acceptable performance across resolution ranges (500px - 3000px)
5. **✅ Style Versatility**: No significant accuracy drops for specific architectural styles
6. **✅ User Experience**: Clear loading states, helpful error messages, informative metrics

---

## Troubleshooting Checklist

If tests are consistently failing:

- [ ] Backend server is running (`npm run server`)
- [ ] API keys are properly configured (`.env` file)
- [ ] Images are valid floor plans (not photos of buildings)
- [ ] Images are <5MB and in PNG/JPEG format
- [ ] Network connection is stable
- [ ] Browser console shows no errors (F12)
- [ ] Server logs show successful API calls
- [ ] Detection metrics panel is displaying results

---

## Next Steps After Testing

1. **Compile Results**: Summarize accuracy metrics across all test images
2. **Identify Patterns**: Note common failure modes or edge cases
3. **Prioritize Improvements**: Focus on highest-impact issues first
4. **Iterate Prompts**: Enhance AI prompts based on findings
5. **Re-test**: Verify improvements with problematic images
6. **Document**: Update this guide with findings and solutions
7. **Share**: Report results to team or stakeholders

---

## Additional Resources

- **Sample Floor Plans**: Search for "architectural floor plan png" or "apartment floor plan 2BR"
- **Free Sources**: 
  - [RoomSketcher Sample Plans](https://www.roomsketcher.com/)
  - [Pinterest Floor Plans](https://www.pinterest.com/search/pins/?q=floor%20plan)
  - [Free Floor Plan Software](https://floorplanner.com/)
- **Testing Tools**:
  - Browser DevTools (F12) for console logs
  - Image compression tools (TinyPNG, Squoosh)
  - Spreadsheet software (Excel, Google Sheets)

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Maintainer**: Interior Design AI Team

