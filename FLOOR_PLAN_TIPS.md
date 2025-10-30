# Floor Plan Analysis - Tips & Troubleshooting

## ✅ What Was Just Fixed

1. **Increased timeouts**:
   - Frontend: 2 minutes (was 90 seconds)
   - Backend: 3 minutes (was 2 minutes default)

2. **Added file size check**: Rejects images > 5MB before processing

3. **Added progress logging**: Check browser console for timing info

4. **Added visible error display**: Errors now show at top of screen

5. **Better error messages**: More helpful guidance when things fail

## 🚀 Quick Start - Upload Floor Plan

### Best Practices

**Image Requirements:**
- ✅ Format: PNG or JPEG
- ✅ Size: **Under 1MB recommended** (5MB max)
- ✅ Resolution: 1024x1024 pixels or smaller
- ✅ Clear, high-contrast floor plan

**Expected Wait Times:**
- Simple (1-2 rooms): 15-30 seconds
- Medium (3-4 rooms): 30-60 seconds
- Complex (5+ rooms): 60-120 seconds

### How to Reduce Image Size

**Option 1: Online Tools**
- TinyPNG.com - Compress PNG/JPEG
- Squoosh.app - Resize and compress

**Option 2: Image Editors**
- Photoshop: File > Export > Save for Web
- GIMP: Image > Scale Image (set to 1024px max)
- Preview (Mac): Tools > Adjust Size

**Option 3: macOS Terminal**
```bash
# Resize to max 1024px width
sips -Z 1024 floor-plan.jpg
```

## 🔍 Monitoring Progress

### Check Browser Console

1. Open DevTools: Press `F12` (Windows) or `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. You'll see:
   ```
   📤 Uploading floor plan: my-plan.jpg (450KB)
   🔍 Starting floor plan analysis (this may take 30-90 seconds)...
   ✅ Floor plan analysis completed in 45.2s
   ```

### Check Backend Logs

Look at the terminal where `npm run dev` is running:
```
🤖 Processing AI request with model: gemini-2.5-flash (with image)
✅ AI request completed in 42.3s
```

## ❌ Common Errors & Solutions

### Error: "Request timed out"

**Cause**: Image is too large or complex

**Solutions**:
1. **Reduce image size**:
   - Compress with TinyPNG
   - Resize to max 1024x1024 pixels
   - Convert to JPEG if it's PNG

2. **Simplify the image**:
   - Remove unnecessary details
   - Increase contrast
   - Remove background patterns

3. **Check internet connection**:
   - Slow upload speeds cause timeouts
   - Try on faster network

### Error: "Failed to connect to backend service"

**Cause**: Backend server not running

**Solution**:
```bash
# Stop any running servers (Ctrl+C)
# Then restart:
npm run dev

# Should see both servers start:
# [0] ✅ Backend server running on http://localhost:3001
# [1] ➜  Local:   http://localhost:3000/
```

### Error: "Image is too large"

**Cause**: File exceeds 5MB

**Solution**:
1. Compress the image (see tools above)
2. Reduce resolution
3. Convert PNG to JPEG (usually smaller)

### Analysis seems stuck (no error after 2 minutes)

**Debug steps**:
1. Check browser console for progress messages
2. Check backend terminal for AI processing logs
3. Look for network errors in DevTools Network tab
4. Verify backend is actually running (`curl http://localhost:3001/health`)

## 🎯 Optimal Image Specs

### For Best Results:

```
Format:      JPEG or PNG
Size:        500KB - 1MB
Dimensions:  800x600 to 1024x1024
Colors:      High contrast (black walls on white)
Details:     Clear room boundaries
             Door/window indicators
             Room labels visible
```

### Example Processing Times

| Image Size | Dimensions  | Rooms | Time      |
|------------|-------------|-------|-----------|
| 250KB      | 800x600     | 2     | 15-20s    |
| 500KB      | 1024x768    | 3     | 25-35s    |
| 1MB        | 1200x900    | 4     | 40-60s    |
| 2MB        | 1920x1080   | 5     | 60-90s    |
| 3MB+       | 2048x1536   | 6+    | 90-120s   |

## 🛠️ Still Having Issues?

### Full Diagnostic Check

1. **Verify backend is running**:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Check API key is set**:
   ```bash
   cat .env.local
   # Should show: GEMINI_API_KEY=...
   ```

3. **Test with smallest possible image**:
   - Use a simple 500x500 PNG
   - Just 1-2 rooms
   - High contrast

4. **Check for errors**:
   - Browser Console (F12)
   - Backend terminal output
   - Network tab in DevTools

### Get More Help

If still stuck, collect these details:
- Image file size (KB/MB)
- Image dimensions (pixels)
- Error message (exact text)
- Browser console logs
- Backend terminal output
- Time it took before timeout

## 📊 Progress Indicators

### What You Should See:

1. **Upload starts**: Loading spinner appears
2. **Console logs**: Progress messages in DevTools
3. **Backend logs**: "Processing AI request" in terminal
4. **Completion**: Floor plan appears on canvas OR error shows

### If Nothing Happens:

- No loading spinner → JavaScript error (check console)
- Loading forever → Check backend is running
- Error after timeout → Image too large/complex

---

**Remember**: Floor plan analysis uses AI and takes time. Be patient and use optimized images for best results!

**Updated**: 2025 - After timeout improvements

