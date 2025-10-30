<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15ek8lT_Bv5DE-nXJHfkA0e94Rp1SLXtv

## Run Locally

**Prerequisites:**  Node.js (v18 or higher)

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp env.example .env.local
   
   # Edit .env.local and add your actual Gemini API key
   # Get your API key from: https://aistudio.google.com/app/apikey
   ```

   Your `.env.local` should contain:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend (Vite): `http://localhost:3000`
   - Backend API: `http://localhost:3001`

### Architecture

The app now uses a **secure backend architecture**:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────▶│  Backend    │────────▶│   Gemini    │
│  (Frontend) │         │   Server    │         │     API     │
│  Port 3000  │◀────────│  Port 3001  │◀────────│             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        API Key stored
                        securely on server
```

**Benefits:**
- ✅ API key never exposed to the browser
- ✅ Rate limiting built-in (30 requests/minute per client)
- ✅ Centralized error handling
- ✅ Ready for production deployment

### Development Scripts

- `npm run dev` - Start both frontend and backend concurrently
- `npm run dev:frontend` - Start only the frontend (requires backend running separately)
- `npm run dev:backend` - Start only the backend server
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build

## API Configuration

### Required APIs

- **Google Gemini API**: Used for all AI features (furniture search, layout suggestions, floor plan analysis, auto-design)
  - Get your API key: https://aistudio.google.com/app/apikey
  - Set in `.env.local` as `GEMINI_API_KEY`
  - ✅ **Status**: Configured and ready to use
  - See [PROJECT_INFO.md](PROJECT_INFO.md) for detailed configuration

### ✅ Security Implementation

**The app now implements proper API key security:**

✅ **Backend API Proxy**: All AI calls go through the Express backend  
✅ **API Key Protected**: Stored server-side in `.env.local`, never sent to browser  
✅ **Rate Limiting**: 30 requests per minute per client IP  
✅ **CORS Protection**: Only accepts requests from configured frontend URL  
✅ **Error Handling**: Proper error messages without exposing sensitive details  

**Important Notes:**
- **Never commit `.env.local`** to version control (it's in `.gitignore`)
- For production, deploy the backend separately with proper environment variables
- Consider adding authentication for multi-user scenarios
- Monitor API usage to stay within Gemini's quotas

### Deployment Considerations

For production deployment:

1. **Backend**: Deploy to a service like Railway, Render, or AWS
   - Set `GEMINI_API_KEY` as environment variable
   - Set `FRONTEND_URL` to your frontend domain
   - Optionally set `PORT` (defaults to 3001)

2. **Frontend**: Deploy to Vercel, Netlify, or similar
   - Set `VITE_API_URL` to your backend URL
   - Build with `npm run build`

3. **Security Enhancements** (recommended):
   - Add authentication (JWT, OAuth)
   - Implement API usage quotas per user
   - Add logging and monitoring
   - Use HTTPS for all connections

### Current Limitations

- **Furniture Images**: The app currently uses placeholder images from picsum.photos. For production use, consider integrating:
  - A furniture catalog API (e.g., from furniture retailers)
  - An image search API
  - Or use Gemini's image generation capabilities

## Features

All core APIs are functional:
- ✅ AI-powered furniture search with structured output
- ✅ Intelligent layout suggestions based on room dimensions
- ✅ Floor plan image analysis (walls, doors, windows detection)
- ✅ Automatic furniture placement using AI
- ✅ Natural language design commands
- ✅ Real-time layout validation with auto-suggestions
- ✅ Project persistence (localStorage)

## Design System

The app features a **modern, sophisticated visual aesthetic** with:

### Color Palette
- **Primary**: Teal gradient (from #0f766e to #14b8a6) - sophisticated and calming
- **Accent**: Emerald, cyan, and purple gradients for different sections
- **Smart Suggestions**: Warm amber/orange accents for important alerts
- **Neutrals**: Refined grays with subtle teal undertones

### Visual Elements
- 🎨 **Gradient backgrounds** throughout the app for depth
- 🪟 **Glass morphism effects** on the header with backdrop blur
- 📦 **Modern card design** with rounded corners (xl), borders, and hover animations
- 🌊 **Smooth transitions** on all interactive elements (200ms duration)
- 💫 **Elevated shadows** that respond to hover states
- 🎯 **Numbered step indicators** with gradient backgrounds
- 🔄 **Custom loading spinners** with teal color scheme

### Typography
- **Font Family**: Inter (Google Fonts) for modern, clean readability
- **Hierarchy**: Clear distinction between headers, labels, and body text
- **Font Weights**: Semibold for labels, bold for headers

### User Experience Enhancements
- Better spacing and padding for improved readability
- Larger, more accessible button targets
- Improved focus states with teal ring indicators
- Enhanced empty states with icons and helpful messages
- Smooth scrollbars with custom styling
- Responsive hover effects that scale and add shadows
- Better visual feedback for all interactions

### Component-Specific Design
- **Control Panel**: Numbered steps with gradient badges, refined inputs with teal focus rings
- **Furniture Sidebar**: Tabbed interface with active state indicators, gradient cart badge
- **Design Canvas**: Teal gradient furniture items, modern "Add to Cart" buttons
- **AI Assistance**: Color-coded action buttons (emerald for auto-design, purple for suggestions)
- **Cart**: Empty state with cart icon, modern item cards with hover effects
- **Smart Suggestions**: Amber-themed alert box with collapsible content
