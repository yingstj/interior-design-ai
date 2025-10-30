import { Type } from "@google/genai";
import type { PlacedFurnitureItem, Suggestion, FurnitureItem, FloorPlanAnalysis, DesignAction, Room, AutoSuggestion } from '../types';
import { AI_MODEL_FAST, AI_MODEL_PRO, FURNITURE_IMAGE_SIZE } from '../constants';
import { getFurnitureImageUrl } from '../utils/furnitureRenderer';
import { cleanFloorPlanAnalysis } from '../utils/floorPlanConverter';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Custom error class for AI service errors
export class AIServiceError extends Error {
  constructor(
    message: string, 
    public readonly originalError?: unknown,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// Helper function to call backend API with timeout
const callBackendAPI = async (model: string, prompt: string | { parts: any[] }, config: any, timeoutMs: number = 60000) => {
  try {
    const body = typeof prompt === 'string' 
      ? { model, prompt, config }
      : { model, parts: prompt.parts, config };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const hasImage = !!(prompt as any).parts;
      console.log(`🔌 Connecting to backend: ${API_URL}/api/generate`);
      console.log(`⏱️ Timeout set to: ${(timeoutMs / 1000).toFixed(0)}s`);
      
      const fetchStart = Date.now();
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const fetchElapsed = ((Date.now() - fetchStart) / 1000).toFixed(1);
      console.log(`📡 Backend responded in ${fetchElapsed}s (status: ${response.status})`);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIServiceError(
          errorData.error || `Backend request failed with status ${response.status}`,
          undefined,
          errorData.retryable !== false
        );
      }

      const data = await response.json();
      console.log(`✓ Received AI response (${data.text?.length || 0} chars)`);
      return { text: data.text };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    
    // Check if it's a timeout/abort error
    if (error.name === 'AbortError') {
      throw new AIServiceError(
        'Request timed out. Please try again with a smaller image or simpler query.',
        error,
        true
      );
    }

    // Check for connection errors
    if (error.message?.includes('fetch') || error.message?.includes('NetworkError')) {
      throw new AIServiceError(
        'Failed to connect to backend service. Please ensure the server is running on http://localhost:3001',
        error,
        true
      );
    }
    
    // Network or other errors
    throw new AIServiceError(
      'Failed to connect to backend service. Please ensure the server is running.',
      error,
      true
    );
  }
};

// --- Schemas ---

const furnitureSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Exact product name from retailer" },
      width: { type: Type.NUMBER, description: "Width in inches" },
      depth: { type: Type.NUMBER, description: "Depth in inches" },
      price: { type: Type.NUMBER, description: "Current retail price in USD" },
      style: { type: Type.STRING, description: "e.g., Modern, Mid-Century, Scandinavian" },
      retailer: { type: Type.STRING, description: "Retailer name (e.g., 'West Elm', 'CB2')" },
      productUrl: { type: Type.STRING, description: "Direct URL to purchase the product" },
      imageUrl: { type: Type.STRING, description: "Direct URL to product image" },
    },
    required: ["name", "width", "depth", "price", "style", "retailer", "productUrl", "imageUrl"],
  },
};

const suggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A short, catchy title for the suggestion." },
            description: { type: Type.STRING, description: "A detailed explanation of the suggestion and its benefits." },
            type: { type: Type.STRING, description: "The type of suggestion: 'layout' for adjusting existing items, 'new_item' for adding furniture, or 'decor' for adding decorative pieces.", enum: ['layout', 'new_item', 'decor']},
        },
        required: ["title", "description", "type"],
    }
};

const pointSchema = {
    type: Type.OBJECT,
    properties: {
        x: { type: Type.NUMBER, description: 'The x-coordinate in pixels from the top-left corner.' },
        y: { type: Type.NUMBER, description: 'The y-coordinate in pixels from the top-left corner.' },
    },
    required: ['x', 'y'],
};

const floorPlanSchema = {
    type: Type.OBJECT,
    properties: {
        imageDimensions: {
            type: Type.OBJECT,
            properties: {
                width: { type: Type.NUMBER, description: 'The total width of the source image in pixels.' },
                height: { type: Type.NUMBER, description: 'The total height of the source image in pixels.' },
            },
            required: ['width', 'height'],
        },
        walls: { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: { start: pointSchema, end: pointSchema, thickness: { type: Type.NUMBER, description: 'Wall thickness in pixels.' } }, required: ['start', 'end', 'thickness'],
        } },
        doors: { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: { position: pointSchema, width: { type: Type.NUMBER }, swingHinge: pointSchema, swingEnd: pointSchema }, required: ['position', 'width', 'swingHinge', 'swingEnd'],
        } },
        windows: { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: { start: pointSchema, end: pointSchema }, required: ['start', 'end'],
        } },
        rooms: { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: { 
                id: { type: Type.STRING, description: 'A unique identifier for the room, e.g., "room-1".' },
                label: { type: Type.STRING }, 
                polygon: { type: Type.ARRAY, items: pointSchema } 
            }, required: ['id', 'label', 'polygon'],
        } },
        fixtures: { type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: { 
                type: { type: Type.STRING, enum: ['toilet', 'sink', 'tub', 'shower', 'stove', 'refrigerator', 'dishwasher', 'washer', 'dryer'] },
                position: pointSchema,
                rotation: { type: Type.NUMBER, description: 'Rotation in degrees: 0, 90, 180, or 270' },
                dimensions: { 
                    type: Type.OBJECT, 
                    properties: { 
                        width: { type: Type.NUMBER }, 
                        depth: { type: Type.NUMBER } 
                    }, 
                    required: ['width', 'depth'] 
                },
                label: { type: Type.STRING, description: 'Optional label like "Ref", "DW", "W/D"' },
            }, required: ['type', 'position', 'rotation'],
        } },
        entryDoor: pointSchema,
        northAngle: { type: Type.NUMBER, description: 'North direction in degrees (0 = up, 90 = right, 180 = down, 270 = left)' },
    },
    required: ['imageDimensions', 'walls', 'doors', 'windows', 'rooms'],
};

const autoPlacementSchema = {
    type: Type.ARRAY,
    description: "A list of furniture items with their placement details.",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Product name, e.g., '3-Seat Sofa'" },
            width: { type: Type.NUMBER, description: "Width of the furniture in inches" },
            depth: { type: Type.NUMBER, description: "Depth of the furniture in inches" },
            price: { type: Type.NUMBER, description: "Approximate price in USD" },
            style: { type: Type.STRING, description: "The style of the furniture item." },
            position: {
                type: Type.OBJECT, properties: {
                    x: { type: Type.NUMBER, description: 'The x-coordinate of the top-left corner in inches.' },
                    y: { type: Type.NUMBER, description: 'The y-coordinate of the top-left corner in inches.' },
                }, required: ['x', 'y'],
            },
            rotation: { type: Type.NUMBER, description: 'Rotation in degrees (0, 90, 180, or 270).' },
        },
        required: ["name", "width", "depth", "price", "style", "position", "rotation"],
    },
};

const newItemDataSchema = {
    type: Type.OBJECT,
    description: "The full details of a new furniture item.",
    properties: {
        name: { type: Type.STRING },
        width: { type: Type.NUMBER, description: "Width in inches" },
        depth: { type: Type.NUMBER, description: "Depth in inches" },
        price: { type: Type.NUMBER, description: "Price in USD" },
        style: { type: Type.STRING, description: "Style of the item" },
        position: {
            type: Type.OBJECT, properties: {
                x: { type: Type.NUMBER, description: 'x-coordinate of top-left corner in inches' },
                y: { type: Type.NUMBER, description: 'y-coordinate of top-left corner in inches' },
            }, required: ['x', 'y'],
        },
        rotation: { type: Type.NUMBER, description: 'Rotation in degrees' },
    },
    required: ["name", "width", "depth", "price", "style", "position", "rotation"],
};

const designActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ['add', 'delete', 'move', 'rotate', 'replace'] },
        itemIdToModify: { type: Type.STRING, description: "The ID of the item to move, delete, or rotate." },
        itemIdToReplace: { type: Type.STRING, description: "The ID of the item to replace." },
        newPosition: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, description: "The new top-left position in inches for a 'move' action." },
        newRotation: { type: Type.NUMBER, description: "The new rotation in degrees for a 'rotate' action." },
        newItemData: { ...newItemDataSchema, description: "Data for a new item for 'add' or 'replace' actions." }
    },
    required: ['action']
};

const designActionsSchema = {
    type: Type.ARRAY,
    description: "A list of actions to modify the design canvas.",
    items: designActionSchema
};

const autoSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "A user-facing description of the layout issue found." },
        action: designActionSchema
    },
    required: ['description', 'action'],
};

const autoSuggestionsSchema = {
    type: Type.ARRAY,
    description: "A list of layout issues and actions to fix them.",
    items: autoSuggestionSchema
};


// --- Helper Functions ---

/**
 * Generates a furniture image URL.
 * Uses SVG bird's eye view representations for consistent, furniture-appropriate images.
 * @deprecated Use getFurnitureImageUrl from utils/furnitureRenderer instead
 */
export const generateFurnitureImageUrl = (furnitureName: string, seed?: string): string => {
  return getFurnitureImageUrl(furnitureName);
};

// --- API Functions ---

export const findFurniture = async (query: string, style: string, budget: number | undefined): Promise<FurnitureItem[]> => {
  if (!query.trim()) {
    throw new AIServiceError('Search query cannot be empty', undefined, false);
  }

  try {
    const budgetPrompt = budget !== undefined 
      ? `under $${budget}` 
      : `at various price points`;
    
    // List of premium furniture retailers to search
    const retailers = [
      'westelm.com',
      'crateandbarrel.com',
      'cb2.com',
      'article.com',
      'roomandboard.com',
      'potterybarn.com'
    ];
    
    const prompt = `Search the web for REAL furniture products that are currently available for purchase. Find 3 actual ${style} style "${query}" items ${budgetPrompt} from these retailers: ${retailers.join(', ')}.

IMPORTANT: These must be REAL products from actual retailer websites, not made-up items.

For each product, you MUST extract from the actual product pages:
1. Exact product name as listed on the website
2. Width in inches (look for dimensions/specs; if not available, provide typical dimensions for this furniture type)
3. Depth in inches (look for dimensions/specs; if not available, provide typical dimensions for this furniture type)  
4. Current price in USD as shown on the website
5. Style category that matches the product
6. Name of the retailer (e.g., "West Elm", "CB2", "Crate & Barrel")
7. Direct URL to the product page where users can purchase
8. Direct URL to a high-quality product image

Search the web and extract this real data from actual product listings.`;

    const response = await callBackendAPI(
      AI_MODEL_FAST,
      prompt,
      { 
        responseMimeType: "application/json", 
        responseSchema: furnitureSchema,
      }
    );

    if (!response.text) {
      throw new AIServiceError('Received empty response from AI service', undefined, true);
    }

    const furnitureList = JSON.parse(response.text);
    
    if (!Array.isArray(furnitureList)) {
      throw new AIServiceError('Invalid response format from AI service', undefined, false);
    }

    return furnitureList.map((item: any, index: number) => {
      // Validate and normalize dimensions (should be in inches)
      let width = item.width;
      let depth = item.depth;
      
      // If dimensions seem too large (likely in cm or unrealistic), normalize them
      if (width > 200 || depth > 200) {
        console.warn(`⚠️ Furniture dimensions seem too large: ${item.name} (${width}" × ${depth}"). Normalizing...`);
        // Assume they might be in cm, convert to inches
        if (width > 200) width = Math.round(width / 2.54);
        if (depth > 200) depth = Math.round(depth / 2.54);
      }
      
      // Set realistic min/max bounds for furniture (in inches)
      width = Math.max(12, Math.min(width, 120)); // Min 1ft, Max 10ft
      depth = Math.max(12, Math.min(depth, 120)); // Min 1ft, Max 10ft
      
      console.log(`🪑 ${item.name}: ${width}" × ${depth}" (${(width/12).toFixed(1)}' × ${(depth/12).toFixed(1)}')`);
      
      return {
        id: `real-${Date.now()}-${index}`,
        name: item.name,
        width,
        depth,
        price: item.price,
        style: item.style,
        imageUrl: getFurnitureImageUrl(item.name, item.imageUrl),
        retailer: item.retailer,
        productUrl: item.productUrl,
      };
    });
  } catch (error) {
    console.error("Error finding furniture:", error);
    if (error instanceof AIServiceError) {
      throw error;
    }
    // Network or other errors
    throw new AIServiceError(
      'Failed to search for real furniture products. Please check your internet connection and try again.',
      error,
      true
    );
  }
};

export const getLayoutSuggestions = async (roomWidth: number, roomHeight: number, placedFurniture: PlacedFurnitureItem[], style: string, budget: number | undefined): Promise<Suggestion[]> => {
    try {
        const furnitureDetails = placedFurniture.map(f => `- ${f.name} (width: ${f.width}", depth: ${f.depth}") at position (x: ${f.position.x}", y: ${f.position.y}") with rotation ${f.rotation} degrees.`).join('\n');
        const budgetPrompt = budget !== undefined ? `Remaining Budget for new items: $${budget}.` : `There are no budget constraints for new items.`;
        const prompt = `You are an expert interior designer AI. A user needs help with their room layout. Room Dimensions: ${roomWidth} feet wide by ${roomHeight} feet deep. User's Style Preference: ${style}. ${budgetPrompt} Current Furniture Layout:\n${furnitureDetails || "The room is currently empty."}\n\nPlease provide 3-4 creative and practical suggestions to improve this space. Suggestions can include adjusting the current layout, adding new furniture that fits the budget, or recommending decor items. For each suggestion, provide a title, a detailed description, and a type ('layout', 'new_item', or 'decor').`;
        
        const response = await callBackendAPI(
            AI_MODEL_PRO,
            prompt,
            { 
              responseMimeType: "application/json", 
              responseSchema: suggestionsSchema, 
            }
        );

        if (!response.text) {
          throw new AIServiceError('Received empty response from AI service', undefined, true);
        }

        const suggestions = JSON.parse(response.text);
        
        if (!Array.isArray(suggestions)) {
          throw new AIServiceError('Invalid response format from AI service', undefined, false);
        }

        return suggestions;
    } catch (error) {
        console.error("Error getting layout suggestions:", error);
        if (error instanceof AIServiceError) {
          throw error;
        }
        throw new AIServiceError(
          'Failed to generate layout suggestions. Please check your internet connection and try again.',
          error,
          true
        );
    }
};

// Helper function for Gemini-based floor plan analysis (fallback)
const analyzeFloorPlanWithGemini = async (imageBase64: string): Promise<FloorPlanAnalysis> => {
    console.log(`🤖 Using Gemini API for detailed floor plan analysis...`);
    const startTime = Date.now();
    
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } };
    const textPart = { 
        text: `Analyze this architectural floor plan image in EXTREME DETAIL according to standard architectural conventions.

STEP 1: Read ALL text on the image
- Room names: Bedroom, Living Room, Kitchen, Bathroom, Balcony
- Dimensions: Like "12'3\"x9'1\""
- Labels: CL (closet), DW (dishwasher), W/D (washer/dryer), Ref (refrigerator)

STEP 2: Identify EVERY architectural element using standard conventions

DOORS - CRITICAL (LOOK CAREFULLY):
• Appearance: Straight line + curved arc (quarter circle) attached to wall
• The arc shows door swing path when opening
• Hinge point: Where arc starts (attached to wall)
• Swing end: Where arc ends (fully open, 90 degrees)
• Types: Entry doors, bedroom doors, bathroom door, closet doors (CL), balcony door
• Expected count: 8-15 doors in typical 2BR apartment
• SEARCH EVERYWHERE for arc symbols - every arc = a door!

WINDOWS - CRITICAL (LOOK CAREFULLY):
• Appearance: Break/gap in thick exterior wall + parallel thin lines across gap
• The thin lines = window glass/frame
• Location: Only on exterior walls (not interior partitions)
• Expected count: 5-15 windows total
  - Living room: 2-4 windows
  - Bedrooms: 1-2 per bedroom
  - Kitchen: 1-2 windows
  - Bathroom: 0-1 small window
• SEARCH ALL exterior walls for breaks - every break = a window!

WALLS:
• Thick solid lines = structural/exterior walls
• Thin lines = interior partitions
• Trace all as wall segments

ROOMS:
- Bedrooms (usually 2+)
- Living/Dining Room (large open space)
- Kitchen (with appliances)
- Bathroom (with toilet, sink, tub symbols)
- Balcony (outdoor space)
- Closets marked "CL" (INSIDE bedrooms, not separate rooms)
- Hallways/Entry

FIXTURES - IDENTIFY ALL:
Kitchen: refrigerator (Ref), stove, dishwasher (DW), sink
Bathroom: toilet, tub, shower, sink
Laundry: washer (W), dryer (D)
For each fixture: type, position (x,y), rotation (0/90/180/270), dimensions, label

ENTRY & NORTH:
- Mark the main entry door position for entry arrow
- Note north direction angle (0=up, 90=right, 180=down, 270=left)

STEP 3: Trace exact boundaries
- Follow the thick black walls
- Create polygon points for each room boundary
- Include coordinates for all corners

ACCURACY CHECKLIST BEFORE RETURNING JSON:
✓ Found 8-15+ DOORS? (scan entire image for arc symbols)
  • Entry door (MARK for entryDoor), bedroom doors (2), bathroom door, closet doors (3-5), balcony door
✓ Found 5-15+ WINDOWS? (scan all exterior walls for breaks)
  • Living room (2-4), bedrooms (2-4), kitchen (1-2), bathroom (0-1)
✓ Found ALL FIXTURES? (kitchen, bathroom, laundry)
  • Kitchen: refrigerator, stove, dishwasher, sink
  • Bathroom: toilet, tub/shower, sink
  • Laundry: washer, dryer (if present)
✓ Traced 50-100+ wall segments (thick and thin lines)
✓ Created 6-8 room polygons (closets are INSIDE rooms, not separate)
✓ All room dimensions included in labels
✓ Identified entryDoor and northAngle

⚠️ CRITICAL: If you found fewer than 5 doors, 3 windows, or 3 fixtures, SCAN AGAIN!

Return ONLY valid JSON (no markdown):
{
  "imageDimensions": {"width": <pixels>, "height": <pixels>},
  "walls": [{"start": {"x": 0, "y": 0}, "end": {"x": 100, "y": 0}, "thickness": 10}],
  "doors": [
    {"position": {"x": 0, "y": 0}, "width": 30, "swingHinge": {"x": 0, "y": 0}, "swingEnd": {"x": 30, "y": 0}}
  ],
  "windows": [
    {"start": {"x": 0, "y": 0}, "end": {"x": 50, "y": 0}}
  ],
  "rooms": [
    {"id": "bedroom-1", "label": "Bedroom (12'3\\"x9'1\\")", "polygon": [{"x": 0, "y": 0}, ...]},
    {"id": "bathroom", "label": "Bathroom", "polygon": [...]},
    {"id": "balcony", "label": "Balcony", "polygon": [...]}
  ],
  "fixtures": [
    {"type": "refrigerator", "position": {"x": 600, "y": 300}, "rotation": 0, "dimensions": {"width": 36, "depth": 30}, "label": "Ref"},
    {"type": "stove", "position": {"x": 650, "y": 300}, "rotation": 0, "dimensions": {"width": 30, "depth": 30}},
    {"type": "toilet", "position": {"x": 400, "y": 200}, "rotation": 90, "dimensions": {"width": 24, "depth": 30}}
  ],
  "entryDoor": {"x": 500, "y": 100},
  "northAngle": 0
}

REMEMBER: Every arc = door. Every wall break = window. Every appliance = fixture. Include them ALL!`
    };
    
    const response = await callBackendAPI(
        AI_MODEL_FAST,
        { parts: [imagePart, textPart] },
        { 
            responseMimeType: "application/json", 
            responseSchema: floorPlanSchema,
            temperature: 0.1
        },
        120000
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Gemini analysis completed in ${elapsed}s`);

    if (!response.text) {
        throw new AIServiceError('Received empty response from Gemini', undefined, true);
    }

    const analysis = JSON.parse(response.text);
    
    if (!analysis.imageDimensions || !analysis.walls || !analysis.doors || !analysis.windows || !analysis.rooms) {
        throw new AIServiceError('Invalid floor plan analysis format', undefined, false);
    }

    return analysis;
};

// Vectorize floor plan image using DALL-E (preprocessing step)
export const vectorizeFloorPlan = async (imageBase64: string): Promise<string> => {
  try {
    console.log('🎨 Calling vectorization API...');
    
    const response = await callBackendAPI('/api/vectorize-floor-plan', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
      timeout: 120000, // 2 minutes for DALL-E generation
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new AIServiceError(
        errorData.message || 'Failed to vectorize floor plan',
        'vectorization',
        response.status
      );
    }
    
    const data = await response.json();
    console.log(`✅ Floor plan vectorized in ${data.elapsedTime}s`);
    
    return data.vectorizedImageBase64;
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }
    
    // If vectorization fails, log warning but don't fail the entire process
    console.warn('⚠️  Vectorization failed, will use original image:', error);
    return imageBase64; // Return original image as fallback
  }
};

// Claude-powered floor plan analysis with Gemini fallback
export const analyzeFloorPlan = async (imageBase64: string, skipVectorization: boolean = false): Promise<FloorPlanAnalysis> => {
    if (!imageBase64) {
        throw new AIServiceError('Image data is required for floor plan analysis', undefined, false);
    }

    try {
        // Step 1: Vectorize the floor plan image (optional preprocessing)
        let processedImageBase64 = imageBase64;
        if (!skipVectorization) {
            console.log('🎨 Step 1: Vectorizing floor plan with DALL-E...');
            try {
                processedImageBase64 = await vectorizeFloorPlan(imageBase64);
                console.log('✅ Vectorization complete, proceeding with analysis');
            } catch (error) {
                console.warn('⚠️  Vectorization failed, using original image:', error);
                // Continue with original image
            }
        } else {
            console.log('⏭️  Skipping vectorization (using original image)');
        }

        // Step 2: Analyze the (vectorized) floor plan with Claude
        console.log(`🎨 Step 2: Analyzing floor plan with Claude Sonnet 4.5...`);
        const startTime = Date.now();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (Claude is fast!)

        try {
            const response = await fetch(`${API_URL}/api/analyze-floor-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageBase64: processedImageBase64 }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`📡 Claude responded in ${elapsed}s (status: ${response.status})`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.warn(`⚠️  Claude API returned error: ${errorData.error || response.status}`);
                throw new AIServiceError(
                    errorData.error || `Floor plan analysis failed with status ${response.status}`,
                    undefined,
                    true // Always allow retry to trigger Gemini fallback
                );
            }

            const data = await response.json();
            
            if (!data.analysis) {
                throw new AIServiceError('Received empty response from Claude', undefined, true);
            }

            let analysis = data.analysis;
            
            // Validate the response has required fields
            if (!analysis.imageDimensions || !analysis.walls || !analysis.doors || !analysis.windows || !analysis.rooms) {
                throw new AIServiceError('Invalid floor plan analysis format', undefined, false);
            }

            const roomCount = analysis.rooms.length;
            console.log(`✅ Claude detected ${roomCount} rooms, ${analysis.walls.length} walls`);
            
            // Apply post-processing: simplify polylines and merge collinear walls
            // Inspired by: https://github.com/syaltamimi/image-to-vector
            analysis = cleanFloorPlanAnalysis(analysis);
            
            console.log(`✅ Floor plan analysis completed successfully`);
            return analysis;
            
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            
            if (fetchError instanceof AIServiceError) {
                throw fetchError;
            }
            
            // Check if it's a timeout/abort error
            if (fetchError.name === 'AbortError') {
                throw new AIServiceError(
                    'Request timed out. Please try again.',
                    fetchError,
                    true
                );
            }

            // Check for connection errors
            if (fetchError.message?.includes('fetch') || fetchError.message?.includes('NetworkError')) {
                throw new AIServiceError(
                    'Failed to connect to backend service. Please ensure the server is running on http://localhost:3001',
                    fetchError,
                    true
                );
            }
            
            throw fetchError;
        }
    } catch (error) {
        console.error("Claude floor plan analysis failed:", error);
        if (error instanceof AIServiceError) {
            throw error;
        }
        throw new AIServiceError(
            'Failed to analyze floor plan. Please ensure the image is a clear floor plan and try again.',
            error,
            true
        );
    }
};

export const getAutoPlacement = async (analysis: FloorPlanAnalysis, roomWidthFt: number, roomHeightFt: number, style: string, budget: number | undefined): Promise<Omit<PlacedFurnitureItem, 'id'|'imageUrl'>[]> => {
    try {
        const budgetPrompt = budget !== undefined ? `and a total budget for new items of $${budget}` : `and no specific budget for new items`;
        const prompt = `You are an expert interior designer AI. Based on the provided structured floor plan data (JSON), automatically furnish the rooms. The user's preferences are a "${style}" style ${budgetPrompt}.

For each piece of furniture, provide its name, real-world dimensions in inches, approximate price, style, and its exact placement (position of top-left corner and rotation) within the room's coordinate system, where the top-left is (0,0). The total available canvas dimensions are ${roomWidthFt * 12} inches wide by ${roomHeightFt * 12} inches high.

Place items logically. For example, sofas against walls, beds in bedrooms, tables with clearance for chairs. Respect walls, door swings, and leave clear pathways for movement. The output must be a JSON array matching the provided schema.

Floor Plan Data:
${JSON.stringify(analysis, null, 2)}
`;
        const response = await callBackendAPI(
            AI_MODEL_PRO,
            prompt,
            {
                responseMimeType: "application/json",
                responseSchema: autoPlacementSchema,
            }
        );

        if (!response.text) {
            throw new AIServiceError('Received empty response from AI service', undefined, true);
        }

        const placement = JSON.parse(response.text);
        
        if (!Array.isArray(placement)) {
            throw new AIServiceError('Invalid auto-placement format', undefined, false);
        }

        return placement;
    } catch (error) {
        console.error("Auto-design failed:", error);
        if (error instanceof AIServiceError) {
            throw error;
        }
        throw new AIServiceError(
            'Failed to generate automatic furniture placement. Please try again.',
            error,
            true
        );
    }
};

export const getDesignActions = async (
    userPrompt: string, room: Room, placedFurniture: PlacedFurnitureItem[], style: string, budget: number | undefined
): Promise<DesignAction[]> => {
    if (!userPrompt.trim()) {
        throw new AIServiceError('Design command cannot be empty', undefined, false);
    }

    try {
        const furnitureDetails = placedFurniture.map(f => `- ID: ${f.id}, Name: ${f.name} (${f.width}"x${f.depth}") at (x:${f.position.x}, y:${f.position.y}), rotation: ${f.rotation}°`).join('\n');
        const budgetPrompt = budget !== undefined ? `$${budget}` : 'No budget specified';
        const prompt = `You are an AI interior design assistant. The user wants to modify their room layout with the command: "${userPrompt}".

Analyze the command and return a sequence of actions to achieve it.

**Context:**
- Room Dimensions: ${room.width}ft x ${room.height}ft (${room.width*12}" x ${room.height*12}")
- Style Preference: ${style}
- Budget for new items: ${budgetPrompt}
- Floor Plan Analysis (if available): ${JSON.stringify(room.analysis, null, 2) || 'None'}
- Current Furniture:
${furnitureDetails || 'Room is empty.'}

**Instructions:**
- **Interpret** the user's request in the context of the current layout.
- **Generate a list of actions** ('add', 'delete', 'move', 'rotate', 'replace').
- For 'add' or 'replace', invent realistic furniture details (name, dimensions, price, style) that fit the request, style, and budget.
- For actions on existing items, you **MUST** use their provided IDs.
- All coordinates and dimensions must be in **inches**.
- Ensure the final layout is logical (e.g., no overlapping furniture, items are accessible).
- Adhere strictly to the JSON schema. For each action object, only include the properties relevant to that action type. For example, a 'delete' action only needs 'action' and 'itemIdToModify'.

Return an array of action objects.`;

        const response = await callBackendAPI(
            AI_MODEL_PRO,
            prompt,
            { 
              responseMimeType: "application/json", 
              responseSchema: designActionsSchema 
            }
        );

        if (!response.text) {
            throw new AIServiceError('Received empty response from AI service', undefined, true);
        }

        const actions = JSON.parse(response.text) as DesignAction[];
        
        if (!Array.isArray(actions)) {
            throw new AIServiceError('Invalid design actions format', undefined, false);
        }

        return actions;
    } catch (error) {
        console.error("Failed to execute AI design command:", error);
        if (error instanceof AIServiceError) {
            throw error;
        }
        throw new AIServiceError(
            'Failed to understand or execute the design command. Please try rephrasing.',
            error,
            true
        );
    }
};

export const getLayoutValidation = async (room: Room, placedFurniture: PlacedFurnitureItem[]): Promise<AutoSuggestion[]> => {
    if (placedFurniture.length < 1) {
        return [];
    }

    try {
        const furnitureDetails = placedFurniture.map(f => `- ID: ${f.id}, Name: ${f.name} (${f.width}"x${f.depth}") at (x:${f.position.x}, y:${f.position.y}), rotation: ${f.rotation}°`).join('\n');
        const prompt = `You are an AI interior design assistant, expert in layout optimization. Analyze the current room layout for any issues.

**Context:**
- Room Dimensions: ${room.width}ft x ${room.height}ft (${room.width*12}" x ${room.height*12}")
- Floor Plan Analysis (for doors/walls, if available): ${JSON.stringify(room.analysis, null, 2) || 'None'}
- Current Furniture:
${furnitureDetails}

**Instructions:**
1.  **Identify Issues:** Look for problems such as:
    -   Furniture items overlapping each other.
    -   Furniture blocking doorways or creating narrow passages (at least 36 inches of clearance is ideal).
    -   Items placed in illogical positions (e.g., a chair facing a wall).
2.  **Generate Fixes:** For EACH issue found, provide:
    -   A concise 'description' of the problem for the user.
    -   A single 'action' object ('move', 'rotate') to fix it.
3.  **Important:**
    -   You MUST use the correct item 'id' for the action.
    -   All coordinates and dimensions must be in **inches**.
    -   If there are no issues, return an empty array.
    -   Adhere strictly to the JSON schema.

Return an array of issue-and-fix objects.`;

        const response = await callBackendAPI(
            AI_MODEL_PRO,
            prompt,
            { responseMimeType: "application/json", responseSchema: autoSuggestionsSchema }
        );

        if (!response.text) {
            console.warn("Empty response from layout validation, returning no suggestions");
            return [];
        }

        const suggestions = JSON.parse(response.text) as AutoSuggestion[];
        
        if (!Array.isArray(suggestions)) {
            console.warn("Invalid layout validation format, returning no suggestions");
            return [];
        }

        return suggestions;
    } catch (error) {
        console.error("Error getting layout validation:", error);
        // Layout validation is non-critical, so we just return empty array instead of throwing
        return [];
    }
};