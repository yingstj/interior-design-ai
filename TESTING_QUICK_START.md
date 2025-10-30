# Floor Plan Testing - Quick Start Guide

## 🚀 Ready to Test!

Your floor plan analysis testing framework is now complete and ready to use!

---

## What You Got

### 1. **Enhanced Loading States** ✅
- Real-time progress bar (0-100%)
- Elapsed time counter
- Dynamic status messages every 10 seconds
- Visual feedback for 30-90 second analysis times

### 2. **Detection Metrics Panel** ✅
- Expandable panel below canvas
- Color-coded quality indicators (✅ Green, ⚠️ Yellow, ❌ Red)
- Metrics: Walls, Doors, Windows, Fixtures, Rooms
- Fixture breakdown and room list
- Copy to clipboard and view JSON

### 3. **Test Data Collector** ✅
- Toggle button in right sidebar (appears after analysis)
- Record test metadata (style, resolution, file size)
- Enter actual counts for accuracy calculation
- Instant accuracy % display
- Export to CSV or JSON

### 4. **Comprehensive Testing Guide** ✅
- `FLOOR_PLAN_TESTING_GUIDE.md` - Full procedures and benchmarks
- `TESTING_FRAMEWORK_COMPLETE.md` - Implementation details

---

## How to Start Testing Right Now

### Step 1: Start the Application

```bash
# Terminal 1: Start the backend server
cd /Users/julieyingst/Downloads/interior-design-ai
npm run server

# Terminal 2: Start the frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Step 2: Prepare Test Images

Gather 10-20 diverse floor plan images:

**Architectural Styles** (2+ each):
- Modern/Contemporary
- Traditional
- Victorian/Historic
- Apartment/Condo
- Commercial

**Quality Levels**:
- High Resolution (2000+ pixels)
- Medium Resolution (1000-2000 pixels)
- Low Resolution (<1000 pixels)

**File Requirements**:
- Format: PNG or JPEG
- Size: <5MB (ideally 1-2MB)

**Where to Find**:
- Pinterest: Search "floor plan 2 bedroom apartment"
- Google Images: "architectural floor plan png"
- RoomSketcher: Free sample plans
- Floorplanner: Public templates

### Step 3: Test Your First Image

1. **Upload the floor plan** using the Control Panel
2. **Watch the progress bar** - it will show:
   - Elapsed time (updates every second)
   - Progress percentage (updates every 2 seconds)
   - Status messages (updates every 10 seconds)
   - Typical time: 30-90 seconds
3. **Wait for analysis to complete**
4. **Expand "Detection Metrics"** panel (click to expand)
5. **Review the metrics**:
   - Check wall, door, window, fixture, room counts
   - Look for quality indicators (colors and icons)
   - Review fixture breakdown
6. **Enable Test Collector** (click "Show Test Collector" button in right sidebar)
7. **Fill in metadata**:
   - Select architectural style
   - Enter resolution (e.g., 1920x1080)
   - Enter file size (e.g., 1.2)
8. **Manually count actual elements** in the original image:
   - Count all doors (look for swing arcs)
   - Count all windows (look for window symbols)
   - Count all fixtures (kitchen/bathroom appliances)
9. **Enter actual counts** in Test Collector
10. **Review accuracy**:
    - Door Accuracy %
    - Window Accuracy %
    - Fixture Accuracy %
    - Overall Quality (Excellent/Good/Fair/Poor)
11. **Add notes** about issues or observations
12. **Export results**:
    - Click "Export CSV" to download and copy to clipboard
    - Or click "Export JSON" for full analysis data

### Step 4: Track Results

Create a master spreadsheet:

| Test ID | Image Name | Style | Resolution | Doors Detected | Doors Actual | Door Accuracy % | Notes |
|---------|-----------|-------|------------|----------------|--------------|-----------------|-------|
| TEST-001 | modern-apt.png | Modern | 1920x1080 | 12 | 14 | 86% | Missed 2 closet doors |
| TEST-002 | traditional.jpg | Traditional | 1024x768 | 8 | 12 | 67% | Low resolution issue |

Paste CSV exports from Test Collector directly into your spreadsheet.

### Step 5: Analyze Results

After testing 10-20 images:

1. **Calculate average accuracy** by style, resolution, quality
2. **Identify patterns**:
   - Are closet doors consistently missed?
   - Do low-resolution images have lower accuracy?
   - Are certain fixture types never detected?
3. **Note edge cases**:
   - Which images had excellent detection (>90%)?
   - Which images had poor detection (<70%)?

### Step 6: Iterate on Prompts (If Needed)

If detection accuracy is consistently <85%:

1. **Identify the issue**:
   - Low door count? → Enhance door detection prompt
   - Low window count? → Enhance window detection prompt
   - Missing fixtures? → Add fixture symbol descriptions

2. **Locate the prompts**:
   - **Claude (primary)**: `server/index.js` lines 183-243
   - **Gemini (fallback)**: `services/geminiService.ts` lines 408-506

3. **Enhance the prompts** with specific guidance:
   ```
   DOOR DETECTION IMPROVEMENTS:
   • Every bedroom MUST have a door
   • Look for closet labels "CL" - these ALWAYS have doors
   • If bedroom count = N, expect at least N+3 doors (bedrooms + bathroom + entry + closets)
   ```

4. **Restart backend**:
   ```bash
   # Stop backend (Ctrl+C in Terminal 1)
   npm run server  # Restart
   ```

5. **Re-test 3-5 problematic images** and compare results

6. **Document improvements** in a changelog

---

## Expected Metrics (Benchmarks)

### 2-Bedroom Apartment (800-1000 sq ft)
- **Walls**: 40-60 segments
- **Doors**: 8-12
- **Windows**: 5-10
- **Fixtures**: 4-7
- **Rooms**: 5-7

### 3-Bedroom House (1500-2000 sq ft)
- **Walls**: 70-100 segments
- **Doors**: 12-18
- **Windows**: 10-18
- **Fixtures**: 6-12
- **Rooms**: 8-12

### Studio Apartment (400-600 sq ft)
- **Walls**: 20-35 segments
- **Doors**: 4-6
- **Windows**: 2-5
- **Fixtures**: 3-5
- **Rooms**: 3-4

---

## Quality Ratings

- **✅ Excellent (90-100%)**: All major elements detected accurately
- **⚠️ Good (70-89%)**: Most elements detected, minor misses
- **⚠️ Fair (50-69%)**: Some elements missed, needs improvement
- **❌ Poor (<50%)**: Many elements missed, prompt iteration needed

---

## Troubleshooting

### Issue: Analysis stuck at "Analyzing..."
- **Check**: Backend server is running (`npm run server`)
- **Check**: Browser console (F12) for errors
- **Check**: Network tab shows request to backend

### Issue: Progress bar not moving
- **Check**: Wait at least 10 seconds (progress updates every 2s)
- **Check**: Console logs show progress updates

### Issue: Detection Metrics panel not showing
- **Check**: Analysis completed successfully (no error message)
- **Check**: `project.room.analysis` exists (view in console)

### Issue: Test Collector export fails
- **Check**: Browser clipboard permissions
- **Check**: File download permissions
- **Try**: Click export again

### Issue: Low detection accuracy (<50%)
- **Check**: Image is clear and high resolution
- **Check**: Image is a proper floor plan (not 3D or photo)
- **Try**: Higher resolution version of same plan
- **Review**: `FLOOR_PLAN_TESTING_GUIDE.md` for prompt iteration

---

## Quick Tips

💡 **Start with high-quality images** for best results (1920x1080+, PNG format)

💡 **Test diverse styles** to identify systematic issues vs. one-off failures

💡 **Use CSV exports** for easy tracking in spreadsheets

💡 **Take screenshots** of rendered results for visual comparison

💡 **Check console logs** (F12) for detailed metrics after each analysis

💡 **Compare similar plans** - test same layout in different resolutions/qualities

💡 **Document patterns** - note which element types are consistently missed

💡 **Iterate incrementally** - test prompt changes on 3-5 images before full re-test

---

## Files Reference

- **Testing Guide**: `FLOOR_PLAN_TESTING_GUIDE.md` (comprehensive procedures)
- **Implementation Details**: `TESTING_FRAMEWORK_COMPLETE.md` (technical details)
- **This Quick Start**: `TESTING_QUICK_START.md` (you are here!)

---

## Example Test Session

```
$ npm run server   # Terminal 1
$ npm run dev      # Terminal 2

# Open http://localhost:5173

1. Upload: modern-apartment-2br.png
   ⏱️ Elapsed: 45s
   ✅ Analysis complete!

2. Detection Metrics:
   Walls: 65 ✅
   Doors: 12 ⚠️ (Expected: 8-15)
   Windows: 8 ✅
   Fixtures: 5 ✅
   Rooms: 6 ✅

3. Show Test Collector:
   Style: Modern
   Resolution: 1920x1080
   File Size: 1.2
   
   Actual Counts:
   Doors: 14 (found 2 missed closet doors)
   Windows: 9 (found 1 missed bathroom window)
   Fixtures: 6 (found 1 missed dishwasher)
   
   Accuracy:
   Door: 86% ✅ Good
   Window: 89% ✅ Good
   Fixture: 83% ✅ Good
   Overall: Good
   
   Notes: "Missed 2 closet doors (CL labels), 1 small bathroom window, dishwasher label not detected"
   
4. Export CSV ✅
   Downloaded: floor-plan-test-TEST-1730000000000.csv
   Copied to clipboard ✅

5. Next image: traditional-house-3br.jpg
   [Repeat process...]
```

---

## Success Criteria

By the end of testing, you should have:

✅ **10-20 test records** with full metadata and metrics  
✅ **Average accuracy >85%** for doors and windows across all tests  
✅ **Pattern identification** (e.g., "Closet doors often missed in Traditional style")  
✅ **Prompt improvements** (if needed) with documented results  
✅ **Master spreadsheet** with all test data for analysis  
✅ **Summary report** of findings and recommendations  

---

**Ready to test? Start with Step 1 above!** 🚀

For detailed guidance, see **`FLOOR_PLAN_TESTING_GUIDE.md`**

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Status**: Ready for Testing

