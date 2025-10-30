import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Validate API keys
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in .env.local');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set in .env.local');
  console.error('Get your API key from: https://console.anthropic.com/account/keys');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in .env.local');
  console.warn('Floor plan vectorization will be skipped.');
  console.warn('Get your API key from: https://platform.openai.com/api-keys');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

const rateLimiter = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, []);
  }
  
  const timestamps = requestCounts.get(clientId);
  const recentRequests = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  recentRequests.push(now);
  requestCounts.set(clientId, recentRequests);
  next();
};

app.use('/api', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generic AI generation endpoint
app.post('/api/generate', async (req, res) => {
  // Extend timeout for AI processing (especially image analysis)
  // Default Express timeout is 2 minutes, we need more for complex AI tasks
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000); // 3 minutes
  
  try {
    const { model, prompt, config, parts } = req.body;

    if (!model || (!prompt && !parts)) {
      return res.status(400).json({ error: 'Missing required fields: model and (prompt or parts)' });
    }

    const contents = parts ? { parts } : prompt;
    
    console.log(`🤖 Processing AI request with model: ${model} ${parts ? '(with image)' : ''}`);
    const startTime = Date.now();
    
    const response = await ai.models.generateContent({
      model,
      contents,
      config: config || {}
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ AI request completed in ${elapsed}s`);

    if (!response.text) {
      return res.status(500).json({ error: 'Empty response from AI service' });
    }

    res.json({ text: response.text });
  } catch (error) {
    const elapsed = ((Date.now() - Date.now()) / 1000).toFixed(1);
    console.error(`❌ AI generation error after ${elapsed}s:`, error.message);
    
    // Handle specific error types
    if (error.message?.includes('quota')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.',
        retryable: true 
      });
    }
    
    if (error.message?.includes('invalid')) {
      return res.status(400).json({ 
        error: 'Invalid request to AI service.',
        retryable: false 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate AI response. Please try again.',
      retryable: true 
    });
  }
});

// DALL-E floor plan vectorization endpoint (preprocessing before analysis)
app.post('/api/vectorize-floor-plan', async (req, res) => {
  // Set longer timeout for image generation (up to 2 minutes)
  req.setTimeout(120000);
  res.setTimeout(120000);
  
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'OpenAI API key not configured',
        message: 'Floor plan vectorization is not available. Please add OPENAI_API_KEY to .env.local'
      });
    }
    
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }
    
    console.log('🎨 Starting floor plan vectorization with GPT-4 Vision + DALL-E...');
    const startTime = Date.now();
    
    // Step 1: Use GPT-4 Vision to analyze and describe the floor plan in detail
    console.log('  📸 Step 1: Analyzing floor plan with GPT-4 Vision...');
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this architectural floor plan in precise detail for recreation. Include: overall dimensions, room layout, wall positions, door locations with swing directions, window placements, fixtures (toilet, sink, tub, appliances), and all text labels (room names and dimensions). Be extremely specific about proportions and spatial relationships.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    const floorPlanDescription = visionResponse.choices[0].message.content;
    console.log('  ✅ Floor plan analyzed');
    
    // Step 2: Use DALL-E 3 to generate a vectorized version based on the description
    console.log('  🎨 Step 2: Generating vectorized floor plan with DALL-E 3...');
    const dalleResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a clean, professional architectural floor plan based on this description:

${floorPlanDescription}

STYLE REQUIREMENTS:
- Black lines on white background
- Vector-style drawing (sharp, clean lines, no textures)
- Thick lines for exterior walls (3-4px)
- Thin lines for interior partitions (1-2px)
- Clear door swing arcs (quarter circles)
- Window symbols (parallel lines)
- Fixture symbols for bathroom and kitchen
- All text labels clearly readable
- Professional CAD/blueprint aesthetic
- NO shadows, gradients, or photo-realistic effects

OUTPUT: A pristine architectural floor plan drawing.`,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'b64_json'
    });
    
    const vectorizedImageBase64 = dalleResponse.data[0].b64_json;
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ Floor plan vectorized in ${elapsedTime}s`);
    
    res.json({
      success: true,
      vectorizedImageBase64,
      elapsedTime: parseFloat(elapsedTime)
    });
    
  } catch (error) {
    console.error('❌ Vectorization error:', error.message);
    res.status(500).json({ 
      error: 'Failed to vectorize floor plan',
      message: error.message 
    });
  }
});

// Claude-powered floor plan analysis endpoint
app.post('/api/analyze-floor-plan', async (req, res) => {
  req.setTimeout(180000); // 3 minutes (though Claude is much faster)
  res.setTimeout(180000);
  
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing required field: imageBase64' });
    }

    console.log(`🎨 Processing floor plan analysis with Claude Sonnet 4.5...`);
    const startTime = Date.now();
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: `Analyze this architectural floor plan in EXTREME DETAIL and extract ALL information with PRECISE coordinates.

CRITICAL INSTRUCTIONS:
1. Read ALL text labels: room names, dimensions (like "12'3\"x9'1\""), appliance labels (CL, DW, W/D, Ref)
2. Identify EVERY space: Bedrooms, Living Room, Kitchen, Bathroom, Balcony, Closets (CL), Hallways
3. Identify ALL architectural features: doors (with swing arcs), windows, walls

CRITICAL ACCURACY REQUIREMENTS:

STEP 1 - UNDERSTAND THE LAYOUT:
Look at the overall floor plan and understand:
- Which rooms are OPEN to each other (no wall between them)
- Which rooms are SEPARATE (wall with door between them)
- Closets are INSIDE bedrooms, not separate rooms
- Entry areas that open directly into living rooms are ONE ROOM, not two

STEP 2 - ARCHITECTURAL FLOOR PLAN CONVENTIONS:

WALLS - EXTREMELY CRITICAL (MUST TRACE ALL WALLS):
• **EXTERIOR WALLS**: Thick solid lines forming the outer perimeter of the unit
  - Trace the COMPLETE outer boundary
  - These define the overall shape of the apartment/home
• **INTERIOR PARTITION WALLS**: Thin lines separating rooms
  - BATHROOM WALLS: Walls enclosing the bathroom space (ALL 4 sides if fully enclosed)
  - BEDROOM WALLS: Walls separating bedrooms from hallways and from each other
  - CLOSET WALLS: Walls forming closet boundaries (usually 3 sides, open on one side for door)
  - KITCHEN WALLS: Walls separating kitchen from other areas
• **WALL DETECTION CHECKLIST**:
  1. Trace the complete exterior perimeter
  2. Trace walls around bathroom (look for toilet/tub/sink fixtures as clue)
  3. Trace walls between bedrooms (labeled "BR", "Bedroom", or with bed symbol)
  4. Trace walls around closets (labeled "CL")
  5. Trace any walls around kitchen (labeled "Kitchen" or with appliance symbols)
  6. Trace any partial walls (room dividers, pony walls)
• **IMPORTANT**: Every room boundary should have walls on all sides UNLESS:
  - It's an open floor plan (living/dining/kitchen combined)
  - There's a doorway opening in that wall (but trace the wall segments on either side of door)

DOORS - CRITICAL (LOOK FOR THESE CAREFULLY):
• APPEARANCE: A straight line segment in the wall + a curved arc (quarter circle)
• The arc shows the door's swing path when opening
• HINGE LOCATION: The arc starts at the hinge point (where it's attached to wall)
• SWING END: The arc ends where the door fully opens (90 degrees)
• TYPES TO FIND:
  - Interior doors (thin line + small arc, typically 30-36 inches)
  - Entry/exterior doors (thicker line + arc, typically 36 inches)
  - Closet doors (may be bifold, shown as two small rectangles, or sliding)
  - Bathroom doors (typically swing INTO bathroom to save space)
• SEARCH EVERYWHERE: Check ALL wall openings, especially:
  - Between hallway and rooms
  - Between rooms and closets (CL)
  - Entry points from exterior/balcony
  - Kitchen openings (may be open archway with no door)
• COUNT: A typical 2BR apartment has 8-15 doors (bedrooms, bathroom, closets, entry, balcony)

WINDOWS - CRITICAL (LOOK FOR THESE CAREFULLY):
• APPEARANCE: A break/gap in thick exterior wall lines + parallel thin lines
• The parallel thin lines across the gap represent the window glass/frame
• LOCATION: Usually only on exterior walls (not interior partitions)
• TYPICAL PATTERNS:
  - Living room: 2-4 large windows
  - Bedrooms: 1-2 windows per bedroom
  - Kitchen: 1-2 windows
  - Bathroom: Often 1 small window (or none)
• DIMENSIONS: Measure from where the thick wall line breaks to where it resumes
• Multiple windows may be grouped together (bay windows, picture windows)
• COUNT: A typical 2BR apartment has 5-15 windows total

FIXTURES & APPLIANCES - CRITICAL (IDENTIFY ALL):
• KITCHEN FIXTURES:
  - Refrigerator: Large rectangle, often labeled "Ref" or "R", typically 36"x30"
  - Dishwasher: Rectangle labeled "DW" or "D", typically 24"x24"
  - Stove/Range: Circles (burners) in a square/rectangle, typically 30"x30"
  - Sink: Curved lines showing bowl shape, typically in counter
• BATHROOM FIXTURES:
  - Toilet: Circle or oval with tank (small rectangle behind), typically 24"x30"
  - Sink/Vanity: Curved oval inside rectangle (counter), typically 24"x18"
  - Bathtub: Rectangle 60"x30", may show drain circle
  - Shower: Square with X or diagonal lines, typically 36"x36"
• LAUNDRY:
  - Washer/Dryer: Two squares side-by-side, labeled "W/D" or "W" and "D", typically 27"x27" each
• CLOSETS:
  - Labeled "CL" or "CLO", these are NOT fixtures but part of room space
• For each fixture, note:
  - Type (toilet, sink, tub, shower, stove, refrigerator, dishwasher, washer, dryer)
  - Position (center point x, y)
  - Rotation (0, 90, 180, or 270 degrees based on orientation)
  - Dimensions (width and depth in pixels)
  - Label if present (Ref, DW, W/D, etc.)

CLOSETS:
• Labeled "CL" or "CLO"
• Small rectangles with swing door lines
• Closets are INSIDE the rooms they serve (not separate room polygons)

OUTDOOR FEATURES:
• Dotted or textured fill = balcony, terrace, garden
• These are separate room polygons

LABELS & DIMENSIONS:
• Centered text = room name
• Dimensions in format "12'3\"x9'1\"" = interior usable space
• Include dimensions in room labels

STEP 3 - GEOMETRIC INTERPRETATION RULES (CRITICAL FOR ACCURACY):

⚠️  STRICT LAYER HIERARCHY - NEVER VIOLATE THIS ORDER:
1️⃣  STRUCTURAL WALLS (TOP PRIORITY - trace first, never modify)
2️⃣  OPENINGS (doors/windows - place in wall breaks)
3️⃣  FIXTURES & APPLIANCES (contained objects - never trace as walls)
4️⃣  TEXT & ANNOTATIONS (ignore outlines completely)

RULE: Elements in lower layers MUST NOT modify or obscure geometry in higher layers.

🚫 FIXTURES ARE NOT WALLS:
• Treat ALL fixtures (tub, toilet, sink, dishwasher, refrigerator, washer, dryer) as CONTAINED OBJECTS
• Fixtures are INSIDE room boundaries, not part of the wall structure
• Fixtures may touch walls but NEVER intersect wall edges
• DO NOT trace fixture outlines as wall segments
• DO NOT use fixture edges to define room polygons

🚫 IGNORE SURFACE PATTERNS:
• Small repetitive hatch marks = tile pattern (bathroom/kitchen floors) → IGNORE
• Dot patterns = balcony/terrace texture → IGNORE  
• Diagonal lines inside rectangles = material fill → IGNORE
• These are NOT partitions, walls, or separate rooms

🚫 IGNORE TEXT BOUNDING BOXES:
• Text labels (room names, dimensions) have outlines/boxes → IGNORE THESE OUTLINES
• Only read the TEXT content, never trace the text box as geometry
• If label text overlaps a wall or fixture, ignore the text outline entirely

✅ FIXTURE CONTAINMENT RULE:
• EVERY fixture MUST be fully contained within ONE continuous room boundary
• If a fixture appears to cross or touch multiple walls, you made an error:
  → Reclassify the room boundaries to ENCLOSE the fixture in a single space
  → The fixture itself is NOT creating a wall or room division
• Example: Toilet in bathroom touches 2 walls = bathroom is ONE room containing the toilet

STEP 4 - DEFINE ROOMS BASED ON WALLS ONLY:
- If "Entry" and "Living Room" have NO wall separating them = they are ONE room
- Closets (CL) are PART OF the room they open into (not separate)
- Only create separate room polygons where STRUCTURAL WALLS separate spaces
- Bathroom is accessed from hallway, NOT from living room (check for walls)
- NEVER split a room because of fixtures - fixtures are INSIDE rooms, not boundaries

STEP 5 - FINAL VALIDATION BEFORE RETURNING (CRITICAL):

**WALL COMPLETENESS CHECK**:
1. Count your walls - typical 2BR apartment has 40-80 wall segments
2. Verify EVERY room has walls on all sides (except open floor plans and doorways)
3. Specifically check:
   ✓ Bathroom has 4 walls (fully enclosed)?
   ✓ Each bedroom has walls separating it from hallway and other rooms?
   ✓ Closets have 3 walls each?
4. If a room boundary looks "open" but should be closed, ADD THE MISSING WALL SEGMENT

**DOOR/WINDOW CHECK**:
1. Count doors - typical 2BR has 8-15 doors
2. Count windows - typical 2BR has 5-15 windows
3. If counts are low, scan the floor plan again for arcs (doors) and breaks in exterior walls (windows)

**FIXTURE CHECK**:
1. Kitchen should have: refrigerator, stove, sink (at minimum)
2. Bathroom should have: toilet, sink, tub OR shower (at minimum)
3. If missing, look for fixture symbols again

Return ONLY valid JSON (no markdown, no explanation):

ARCHITECTURAL STANDARDS QUICK REFERENCE:
• WALLS: Thick solid lines (structural) + thin lines (partitions) → trace all as wall segments
• DOORS: Look for arc symbols (quarter circles) attached to walls → hinge at arc start, door end at arc end
  ⚠️ CRITICAL: Scan the ENTIRE floor plan for arcs - they indicate door swings!
• WINDOWS: Look for gaps/breaks in thick exterior walls with parallel thin lines → mark opening start/end
  ⚠️ CRITICAL: Check ALL exterior walls for breaks - these are windows!
• ROOMS: White space between walls → create polygons filling these spaces
• CLOSETS: CL labels → part of parent room, not separate polygons
• FIXTURES: Thin shapes (toilet, sink, stove) → note but don't trace as walls

BEFORE YOU FINALIZE YOUR RESPONSE:
1. Count your doors - do you have at least 8? If not, look for more arcs!
2. Count your windows - do you have at least 5? If not, look for more wall breaks!
3. Every arc = a door. Every wall break on exterior = a window.

{
  "imageDimensions": {
    "width": <image_width_pixels>,
    "height": <image_height_pixels>
  },
  "walls": [
    {"start": {"x": <pixel>, "y": <pixel>}, "end": {"x": <pixel>, "y": <pixel>}, "thickness": <pixels>}
  ],
  "doors": [
    {"position": {"x": <pixel>, "y": <pixel>}, "width": <pixels>, "swingHinge": {"x": <pixel_at_hinge>, "y": <pixel_at_hinge>}, "swingEnd": {"x": <pixel_at_arc_end>, "y": <pixel_at_arc_end>}}
  ],
  "windows": [
    {"start": {"x": <pixel>, "y": <pixel>}, "end": {"x": <pixel>, "y": <pixel>}}
  ],
  "rooms": [
    {"id": "bedroom-1", "label": "Bedroom (12'3\"x9'1\")", "polygon": [
      {"x": 100, "y": 150},
      {"x": 300, "y": 150},
      {"x": 300, "y": 350},
      {"x": 100, "y": 350}
    ]},
    {"id": "living-room", "label": "Living/Dining Room (8'6\"x16'11\")", "polygon": [
      {"x": 500, "y": 200},
      {"x": 800, "y": 200},
      {"x": 800, "y": 250},
      {"x": 750, "y": 250},
      {"x": 750, "y": 600},
      {"x": 800, "y": 600},
      {"x": 800, "y": 650},
      {"x": 500, "y": 650}
    ]}
  ],
  "fixtures": [
    {"type": "refrigerator", "position": {"x": 600, "y": 300}, "rotation": 0, "dimensions": {"width": 36, "depth": 30}, "label": "Ref"},
    {"type": "stove", "position": {"x": 650, "y": 300}, "rotation": 0, "dimensions": {"width": 30, "depth": 30}},
    {"type": "dishwasher", "position": {"x": 700, "y": 300}, "rotation": 0, "dimensions": {"width": 24, "depth": 24}, "label": "DW"},
    {"type": "toilet", "position": {"x": 400, "y": 200}, "rotation": 90, "dimensions": {"width": 24, "depth": 30}},
    {"type": "tub", "position": {"x": 450, "y": 200}, "rotation": 0, "dimensions": {"width": 60, "depth": 30}},
    {"type": "sink", "position": {"x": 500, "y": 200}, "rotation": 0, "dimensions": {"width": 24, "depth": 18}},
    {"type": "washer", "position": {"x": 300, "y": 400}, "rotation": 0, "dimensions": {"width": 27, "depth": 27}, "label": "W"},
    {"type": "dryer", "position": {"x": 327, "y": 400}, "rotation": 0, "dimensions": {"width": 27, "depth": 27}, "label": "D"}
  ],
  "entryDoor": {"x": 500, "y": 100},
  "northAngle": 0
}

COMMON FLOOR PLAN PATTERNS:
- Living/Dining Room is usually the LARGEST open space
- If you see "Entry" near Living Room with NO wall between = same room
- Bedrooms are SEPARATE enclosed spaces with closets (CL) inside
- Bathroom is accessed from hallway, not living room
- Kitchen is typically adjacent to living/dining area
- Balcony has an exterior door from a room

TYPICAL 2-BEDROOM APARTMENT ROOMS (like this one):
1. Living/Dining Room + Entry (ONE continuous space) - largest area
2. Bedroom 1 (with CL inside)
3. Bedroom 2 (with CL inside)  
4. Kitchen
5. Bathroom (accessed from hallway near bedrooms)
6. Balcony (exterior space)
7. Hallway (connects rooms)
8. Additional CL closets in hallway

ENTRY DOOR & NORTH ARROW:
• Entry Door: Identify the MAIN entrance door (usually larger, from exterior/hallway to apartment)
  - Mark the position (x, y) of this door for entry arrow annotation
  - This is typically the first door you encounter entering the apartment
• North Angle: Determine orientation
  - If there's a north arrow symbol on the plan, use that direction
  - Otherwise, assume north = 0 degrees (pointing up)
  - Values: 0 = up, 90 = right, 180 = down, 270 = left

ACCURACY CHECKLIST BEFORE RETURNING JSON:

✓ LAYER HIERARCHY FOLLOWED:
  • Traced all walls FIRST (structural layer)
  • Placed doors/windows in wall breaks SECOND (openings layer)
  • Identified fixtures THIRD (contained objects, not walls)
  • Ignored text bounding boxes COMPLETELY

✓ WALLS (50-100+ segments):
  • Traced all thick AND thin lines as wall segments
  • DID NOT trace fixture outlines as walls
  • DID NOT trace text boxes as walls
  • DID NOT trace tile/texture patterns as partitions

✓ DOORS (8-15+ expected):
  • Entry door (exterior) ← MARK THIS as entryDoor
  • Bedroom doors (2 minimum)
  • Bathroom door (1)
  • Closet doors (CL - usually 3-5)
  • Balcony door (if present)

✓ WINDOWS (5-15+ expected):
  • Living room windows (usually 2-4)
  • Bedroom windows (1-2 per bedroom)
  • Kitchen windows (1-2)
  • Bathroom window (0-1)

✓ FIXTURES (all identified as CONTAINED OBJECTS):
  • Kitchen: refrigerator, stove, dishwasher, sink
  • Bathroom: toilet, tub/shower, sink
  • Laundry: washer, dryer (if present)
  • ALL fixtures are INSIDE room polygons (not touching boundaries)
  • NO fixtures traced as walls or room dividers

✓ ROOMS (6-8 polygons):
  • Defined by WALLS ONLY, not fixtures
  • Closets (CL) are part of parent bedroom polygons
  • Living/Dining + Entry = ONE large polygon if no wall separates them
  • Bathroom = ONE polygon containing all fixtures (toilet, tub, sink)
  • Room polygon coordinates align with wall segment endpoints
  • All dimensions from labels included in room names

✓ METADATA:
  • Identified entryDoor location (main entrance)
  • Set northAngle (0 if no north arrow shown)

CRITICAL FINAL CHECK:
• Did ANY fixture cross multiple room boundaries? → FIX: Make it ONE room
• Did I trace any appliance outline as a wall? → FIX: Remove those wall segments
• Did I treat tile patterns as partitions? → FIX: Ignore those patterns
• Did I trace text boxes as geometry? → FIX: Ignore text outlines
• If you found fewer than 5 doors, 3 windows, or 3 fixtures → SCAN AGAIN`
          }
        ]
      }]
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Claude analysis completed in ${elapsed}s`);

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      return res.status(500).json({ error: 'Empty response from Claude' });
    }

    // Parse the JSON response
    let analysisData;
    try {
      // Claude might wrap in markdown code blocks, so let's handle that
      let jsonText = textContent.text.trim();
      
      // Remove markdown code block wrappers
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*\n?/g, '').replace(/\n?```\s*$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*\n?/g, '').replace(/\n?```\s*$/g, '');
      }
      
      // Try to extract JSON if Claude added explanatory text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      analysisData = JSON.parse(jsonText);
      
      // Validate required fields
      if (!analysisData.imageDimensions || !analysisData.walls || !analysisData.doors || 
          !analysisData.windows || !analysisData.rooms) {
        throw new Error('Missing required fields in analysis');
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response:');
      console.error('Raw response:', textContent.text.substring(0, 500));
      console.error('Parse error:', parseError.message);
      return res.status(500).json({ 
        error: 'Failed to parse floor plan analysis. Claude may have returned invalid JSON.',
        details: parseError.message,
        retryable: true
      });
    }

    res.json({ analysis: analysisData });
  } catch (error) {
    const elapsed = ((Date.now() - Date.now()) / 1000).toFixed(1);
    console.error(`❌ Claude analysis error:`, error.message);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'API rate limit exceeded. Please try again in a moment.',
        retryable: true 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze floor plan. Please try again.',
      retryable: true 
    });
  }
});

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [clientId, timestamps] of requestCounts.entries()) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      requestCounts.delete(clientId);
    } else {
      requestCounts.set(clientId, recent);
    }
  }
}, 300000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    retryable: true 
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`✅ Accepting requests from: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`✅ Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`);
});

