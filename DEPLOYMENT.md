# 🚀 Deploying to GitHub + Vercel

## Overview

This guide will help you:
1. **Push code to GitHub** (version control)
2. **Deploy to Vercel** (free hosting for frontend + backend)

**Result**: Your app will be live at `https://your-project.vercel.app`

---

## Prerequisites

- GitHub account ([sign up here](https://github.com/signup))
- Vercel account ([sign up here](https://vercel.com/signup)) - use GitHub to sign in
- Git installed on your computer

---

## Step 1: Push to GitHub

### 1.1 Create a New Repository on GitHub

1. Go to https://github.com/new
2. Name it: `interior-design-ai`
3. **Keep it PUBLIC** (for free Vercel hosting)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### 1.2 Connect Your Local Repo to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
cd /Users/julieyingst/Downloads/interior-design-ai

# Check current status
git status

# Add all files
git add .

# Commit changes
git commit -m "feat: Add client-side floor plan vectorization with OpenCV.js"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/interior-design-ai.git

# Or if you already have a remote:
git remote set-url origin https://github.com/YOUR_USERNAME/interior-design-ai.git

# Push to GitHub
git push -u origin main
```

**Important**: Before pushing, create a `.env.local.example` file (so others know what env vars to set):

```bash
# Copy your .env.local as a template
cp .env.local .env.local.example

# Edit it to remove actual keys (keep it as a template)
```

Then edit `.env.local.example` to look like this:

```bash
# Gemini API (for furniture search, suggestions, auto-design)
GEMINI_API_KEY=your_gemini_api_key_here

# Claude API (for floor plan analysis)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: OpenAI API (for DALL-E vectorization - not used by default)
# OPENAI_API_KEY=your_openai_api_key_here
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Your GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import" next to your `interior-design-ai` repo
3. Vercel will auto-detect it's a Vite project ✅

### 2.2 Configure Project Settings

**Framework Preset**: Vite (auto-detected)  
**Build Command**: `npm run build` (default is correct)  
**Output Directory**: `dist` (default is correct)  
**Install Command**: `npm install` (default is correct)

### 2.3 Add Environment Variables

Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `ANTHROPIC_API_KEY` | Your Anthropic/Claude API key |
| `FRONTEND_URL` | Leave empty (Vercel will auto-set) |

**Important**: Check "Add to Production" for all variables

### 2.4 Deploy!

Click **"Deploy"**

Vercel will:
- Install dependencies (~2 minutes)
- Build the frontend (~1 minute)
- Deploy the serverless functions (~30 seconds)

**Total time**: ~3-4 minutes

---

## Step 3: Verify Deployment

### 3.1 Check Deployment URL

Once deployed, Vercel will show:
```
🎉 Your project is live at:
https://interior-design-ai-xyz123.vercel.app
```

### 3.2 Test the App

1. **Open the URL** in your browser
2. **Check console** for:
   ```
   ✅ Floor plan vectorization ready (OpenCV.js loaded)
   ```
3. **Upload a floor plan** and verify it works

### 3.3 Test API Endpoints

Open DevTools Console and run:
```javascript
fetch('https://your-app.vercel.app/api/health')
  .then(r => r.text())
  .then(console.log);
```

Should return: `Interior Design AI API is running`

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `Cannot find module 'react'`

**Fix**: Make sure `@types/react` and `@types/react-dom` are in `devDependencies`

---

### API Calls Fail

**Error**: `Failed to fetch` or `CORS error`

**Fix**: Check that environment variables are set correctly in Vercel dashboard:
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add `GEMINI_API_KEY` and `ANTHROPIC_API_KEY`
4. Redeploy

---

### OpenCV.js Not Loading

**Error**: `OpenCV.js not available`

**Fix**: This is expected to take 5-10 seconds. If it persists:
1. Check browser console for CSP errors
2. Ensure `docs.opencv.org` is not blocked by your network

---

### Backend Routes 404

**Error**: `/api/analyze-floor-plan` returns 404

**Fix**: Check `vercel.json` routes configuration:
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

---

## Custom Domain (Optional)

### Add Your Own Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `mydesignapp.com`)
4. Follow DNS configuration instructions

Vercel provides:
- ✅ Free SSL certificates
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## Automatic Deployments

### Every Push = New Deployment

Once connected to GitHub:
- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployments
- **Pull requests** → Automatic preview URLs

Example workflow:
```bash
# Make changes
git add .
git commit -m "feat: Add new feature"
git push

# Vercel automatically deploys!
```

---

## Monitoring & Analytics

### Vercel Dashboard

- **Deployments**: See all your deployments
- **Analytics**: Page views, performance
- **Logs**: Real-time function logs (for debugging backend)
- **Speed Insights**: Performance metrics

Go to: https://vercel.com/dashboard

---

## Cost Considerations

### Vercel Free Tier

- ✅ **100GB bandwidth** per month
- ✅ **Unlimited deployments**
- ✅ **Unlimited preview URLs**
- ✅ **Serverless functions** (100 hours execution/month)

**Typical usage for this app**:
- Frontend: ~10-20MB per user visit
- Backend: ~1-2 seconds per floor plan analysis
- **Cost**: FREE for personal projects (up to ~1000 analyses/month)

### Claude API Costs

- **Floor plan analysis**: ~$0.02 per image
- **Furniture search**: ~$0.01 per query
- **Auto-design**: ~$0.03 per generation

**Estimated monthly cost** (for 100 users):
- 100 floor plans: $2.00
- 500 searches: $5.00
- 50 auto-designs: $1.50
- **Total**: ~$8.50/month

---

## Security Checklist

Before deploying:

- ✅ `.env.local` is in `.gitignore` (API keys not pushed)
- ✅ Environment variables added to Vercel dashboard
- ✅ CORS is configured (only allows your domain)
- ✅ Rate limiting is enabled (30 requests/minute)
- ✅ Input validation is in place (file size, content type)

---

## Updating the Live Site

### Deploy New Changes

```bash
# Make your changes
# ... edit files ...

# Commit and push
git add .
git commit -m "fix: Improve wall detection"
git push

# Vercel auto-deploys in ~3 minutes
```

### Rollback to Previous Version

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

---

## Alternative Deployment Options

### Option 2: Netlify

Similar to Vercel, but requires Netlify Functions for backend:

```bash
npm install netlify-cli -g
netlify init
netlify deploy --prod
```

### Option 3: GitHub Pages (Frontend Only)

GitHub Pages can host the frontend, but you'll need a separate backend (Heroku, Railway, Render):

```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **Vite Docs**: https://vitejs.dev/guide/

---

## Quick Reference Commands

```bash
# Development
npm run dev                 # Start local servers

# Build
npm run build               # Build for production
npm run preview             # Preview production build locally

# Git
git status                  # Check what changed
git add .                   # Stage all changes
git commit -m "message"     # Commit changes
git push                    # Push to GitHub (auto-deploys to Vercel)

# Vercel CLI (optional)
npm i -g vercel             # Install Vercel CLI
vercel                      # Deploy from terminal
vercel --prod               # Deploy to production
vercel logs                 # View function logs
```

---

## 🎉 You're Live!

Your app is now:
- ✅ Hosted on Vercel
- ✅ Auto-deploying from GitHub
- ✅ Accessible worldwide
- ✅ SSL secured (HTTPS)
- ✅ Backed up in version control

**Share your URL**: `https://your-project.vercel.app`

