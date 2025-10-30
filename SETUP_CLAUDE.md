# Quick Start: Claude API Setup

## ⚡ 3-Minute Setup

### Step 1: Get Your Claude API Key (2 minutes)

1. Go to: **https://console.anthropic.com/**
2. Sign up or log in
3. Click "Get API Keys" or go to: https://console.anthropic.com/account/keys
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-api...`)

**Free Credits:** New accounts get $5 in free credits!

### Step 2: Add API Key to Your Project (30 seconds)

Open your `.env.local` file and add:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

Your `.env.local` should now look like:

```bash
GEMINI_API_KEY=AIzaSyA0ql6Bz1fkNjBF...
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

### Step 3: Restart the Server (30 seconds)

```bash
# Press Ctrl+C to stop current servers
# Then restart:
npm run dev
```

**You should see:**
```
✅ Backend server running on http://localhost:3001
✅ Accepting requests from: http://localhost:3000
```

**If you see an error** about missing API key, double-check your `.env.local` file.

### Step 4: Test It! (30 seconds)

1. Open http://localhost:3000
2. Click "Upload Floor Plan"
3. Select your floor plan image
4. **Watch it analyze in 2-10 seconds!** ⚡

**Console should show:**
```
📤 Uploading floor plan: plan.jpg (240KB)
🎨 Using Claude API for fast floor plan analysis...
📡 Claude responded in 3.2s (status: 200)
✅ Floor plan analysis successful: 5 rooms detected
```

## ✅ That's It!

Your floor plan analysis is now **5-10x faster** using Claude instead of Gemini!

---

## 💰 Cost Information

**Typical floor plan analysis cost:** $0.01-0.05 per image

With $5 free credits, you can analyze **100-500 floor plans** for free!

### Pricing Details
- Claude 3.5 Sonnet (what we're using)
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- 1 floor plan ≈ 1,000-3,000 tokens

---

## 🔧 Troubleshooting

### "ANTHROPIC_API_KEY is not set"

**Fix:**
1. Check `.env.local` exists (not `env.example`)
2. Verify the API key line has no typos
3. Restart servers with `npm run dev`

### "Authentication error"

**Fix:**
1. Verify your API key is correct
2. Make sure it starts with `sk-ant-api`
3. Check your Anthropic account is active

### Still seeing slow analysis (30+ seconds)

**Fix:**
1. Make sure backend restarted after adding API key
2. Check console logs for "Using Claude API" message
3. If you see "Processing AI request with model: gemini", Claude isn't being used

---

## 📊 What's Using What?

| Feature | API Used | Why |
|---------|----------|-----|
| **Floor Plan Analysis** | 🎨 Claude | Fast image understanding |
| Furniture Search | Gemini | Text generation |
| Layout Suggestions | Gemini | Design recommendations |
| Auto-Design | Gemini | Furniture placement |
| Design Commands | Gemini | Natural language |

---

## 🎯 Next Steps

Once you've verified floor plan analysis works:

1. ✅ Try your apartment floor plan
2. ✅ Test with different floor plan styles
3. ✅ Enjoy the speed improvement!

**Questions?** See `CLAUDE_INTEGRATION.md` for detailed documentation.

