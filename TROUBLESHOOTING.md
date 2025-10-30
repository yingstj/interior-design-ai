# Troubleshooting Guide

## Floor Plan Analysis Taking Too Long / Hanging

### Quick Fix Checklist

1. **Check if backend server is running:**
   ```bash
   # Open a new terminal and check if port 3001 is responding:
   curl http://localhost:3001/health
   
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **If backend is NOT running:**
   ```bash
   # Make sure you installed dependencies:
   npm install
   
   # Start the development servers:
   npm run dev
   
   # OR start backend only:
   npm run dev:backend
   ```

3. **Check your .env.local file exists:**
   ```bash
   # Should exist in project root:
   ls -la .env.local
   
   # Should contain:
   cat .env.local
   # GEMINI_API_KEY=your_key_here
   ```

### Common Issues

#### Issue 1: "Request timed out"
**Cause**: Image is too large or complex  
**Solution**:
- Reduce image file size (< 2MB recommended)
- Use simpler floor plan images
- The timeout is set to 90 seconds for floor plans

#### Issue 2: "Failed to connect to backend service"
**Cause**: Backend server not running  
**Solution**:
```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend  
npm run dev:frontend

# OR use concurrently (starts both):
npm run dev
```

#### Issue 3: Backend starts but shows errors
**Cause**: Missing API key or dependencies  
**Solution**:
```bash
# 1. Ensure .env.local exists with your API key
echo "GEMINI_API_KEY=your_actual_key" > .env.local

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Restart servers
npm run dev
```

#### Issue 4: CORS errors in browser console
**Cause**: Frontend/backend port mismatch  
**Solution**:
- Ensure frontend is on port 3000
- Ensure backend is on port 3001
- Check browser console for exact error

### Checking Backend Status

**Method 1: Terminal output**
When you run `npm run dev`, you should see:
```
[0] ✅ Backend server running on http://localhost:3001
[0] ✅ Accepting requests from: http://localhost:3000
[0] ✅ Rate limit: 30 requests per minute
[1] 
[1] VITE v6.2.0  ready in 500 ms
[1] 
[1] ➜  Local:   http://localhost:3000/
```

**Method 2: Browser DevTools**
1. Open DevTools (F12)
2. Go to Network tab
3. Upload a floor plan
4. Look for request to `http://localhost:3001/api/generate`
5. Check response status and time

### Performance Tips

#### Image Optimization
```bash
# Before uploading, resize large images:
# - Max dimensions: 1024x1024 pixels
# - Format: PNG or JPEG
# - File size: < 2MB
```

#### Expected Processing Times
- Simple floor plan (1 room): 10-20 seconds
- Medium floor plan (2-3 rooms): 20-40 seconds
- Complex floor plan (4+ rooms): 40-90 seconds

### Debug Mode

To see detailed error messages:

1. **Check backend logs:**
   - Look at terminal where backend is running
   - Errors are logged with `console.error`

2. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for error messages in red

3. **Check Network tab:**
   - DevTools → Network
   - Filter by "Fetch/XHR"
   - Click on failed requests
   - Check Response tab for error details

### Still Having Issues?

1. **Restart everything:**
   ```bash
   # Kill all Node processes
   pkill node
   
   # Fresh start
   npm run dev
   ```

2. **Check Node version:**
   ```bash
   node --version
   # Should be v18 or higher
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

4. **Verify API key:**
   - Go to https://aistudio.google.com/app/apikey
   - Generate a new key if needed
   - Update `.env.local`
   - Restart servers

### Error Messages Reference

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Failed to connect to backend service" | Backend not running | Start backend with `npm run dev:backend` |
| "Request timed out" | Image too large/complex | Use smaller image |
| "API quota exceeded" | Gemini API limit reached | Wait or check quotas |
| "Invalid response format" | AI returned bad data | Try again or simplify image |
| "Storage quota exceeded" | localStorage full | Clear browser data |

### Quick Test

Run this to verify everything works:

```bash
# 1. Check backend health
curl http://localhost:3001/health

# 2. Test AI endpoint (with dummy data)
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.5-flash","prompt":"Say hello","config":{}}'

# Should return AI response
```

### Contact

If you're still stuck:
1. Check the error message in browser console
2. Check the backend terminal output
3. Share both error messages for better help

---

**Last Updated**: 2025

