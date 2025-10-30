# Real Furniture Products Implementation

## Strategy: Web Search with Gemini + Product Extraction

Use Gemini's web grounding capabilities to search actual furniture retailer websites and extract real product information.

## Target Retailers

Premium furniture retailers with good product data:
- **West Elm** (westelm.com)
- **Crate & Barrel** (crateandbarrel.com)
- **CB2** (cb2.com)
- **Article** (article.com)
- **Pottery Barn** (potterybarn.com)
- **Room & Board** (roomandboard.com)
- **IKEA** (ikea.com)
- **Wayfair** (wayfair.com)

## Implementation

### Step 1: Enable Web Search in Gemini

Gemini 2.0+ models support web grounding (searching the web and citing sources).

### Step 2: Update the `findFurniture` Function

Replace the current implementation with real web search:

```typescript
// In services/geminiService.ts

export const findFurniture = async (
  query: string, 
  style: string, 
  budget: number | undefined
): Promise<FurnitureItem[]> => {
  if (!query.trim()) {
    throw new AIServiceError('Search query cannot be empty', undefined, false);
  }

  try {
    const budgetPrompt = budget !== undefined 
      ? `under $${budget}` 
      : `at various price points`;
    
    const retailers = [
      'westelm.com',
      'crateandbarrel.com', 
      'cb2.com',
      'article.com',
      'roomandboard.com'
    ];
    
    const prompt = `Search the web for real furniture products. Find 3 actual ${style} style ${query} items ${budgetPrompt} from these retailers: ${retailers.join(', ')}.

For each product, extract:
- Exact product name from the website
- Width in inches (if not listed, estimate based on typical dimensions)
- Depth in inches (if not listed, estimate based on typical dimensions)
- Actual current price in USD
- Style category
- Direct URL to the product page
- Direct URL to the product image

Important: These must be REAL products that are currently available for purchase. Include the product URL so users can buy them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Supports web grounding
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: realFurnitureSchema,
      },
    });

    if (!response.text) {
      throw new AIServiceError('Received empty response from AI service', undefined, true);
    }

    const furnitureList = JSON.parse(response.text);
    
    if (!Array.isArray(furnitureList)) {
      throw new AIServiceError('Invalid response format from AI service', undefined, false);
    }

    return furnitureList.map((item: any, index: number) => ({
      ...item,
      id: `real-${Date.now()}-${index}`,
      imageUrl: item.imageUrl || generateFurnitureImageUrl(item.name, `${item.name}-${index}`),
      productUrl: item.productUrl, // New field for purchase link
    }));
  } catch (error) {
    console.error("Error finding furniture:", error);
    if (error instanceof AIServiceError) {
      throw error;
    }
    throw new AIServiceError(
      'Failed to search for furniture. Please check your internet connection and try again.',
      error,
      true
    );
  }
};
```

### Step 3: Update Schema to Include Product URLs

```typescript
// In services/geminiService.ts

const realFurnitureSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { 
        type: Type.STRING, 
        description: "Exact product name from retailer website" 
      },
      width: { 
        type: Type.NUMBER, 
        description: "Width in inches" 
      },
      depth: { 
        type: Type.NUMBER, 
        description: "Depth in inches" 
      },
      price: { 
        type: Type.NUMBER, 
        description: "Current price in USD from website" 
      },
      style: { 
        type: Type.STRING, 
        description: "e.g., Modern, Mid-Century, Scandinavian" 
      },
      retailer: {
        type: Type.STRING,
        description: "Name of the retailer (e.g., 'West Elm', 'CB2')"
      },
      productUrl: {
        type: Type.STRING,
        description: "Direct URL to the product page where user can purchase"
      },
      imageUrl: {
        type: Type.STRING,
        description: "Direct URL to the product image"
      },
    },
    required: ["name", "width", "depth", "price", "style", "retailer", "productUrl", "imageUrl"],
  },
};
```

### Step 4: Update TypeScript Types

```typescript
// In types.ts

export interface FurnitureItem {
  id: string;
  name: string;
  width: number; // in inches
  depth: number; // in inches
  price: number;
  imageUrl: string;
  style: string;
  retailer?: string; // NEW: Which store it's from
  productUrl?: string; // NEW: Link to buy the product
}
```

### Step 5: Update UI to Show "Buy Now" Links

```typescript
// In components/FurnitureSidebar.tsx or DesignCanvas.tsx

// Add a "Buy Now" button for items with productUrl
{item.productUrl && (
  <a
    href={item.productUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-700 hover:to-emerald-700 transition-all"
  >
    <span>Buy at {item.retailer}</span>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  </a>
)}
```

## Pros of This Approach

✅ **Real Products**: Actual furniture people can buy
✅ **Current Prices**: Live pricing from retailer websites  
✅ **Real Images**: Product photos from the retailers
✅ **Purchase Links**: Users can click through to buy
✅ **No Extra APIs**: Uses your existing Gemini API key
✅ **Multiple Retailers**: Searches across several stores
✅ **Fresh Data**: Always gets current inventory

## Considerations

⚠️ **Rate Limits**: Web searches count toward Gemini API quota
⚠️ **Response Time**: Web searches take 3-5 seconds vs <1 second for generated data
⚠️ **Accuracy**: AI must parse web pages correctly
⚠️ **Product Availability**: Products may go out of stock

## Enhanced Version: Caching Real Products

To improve performance, cache successful searches:

```typescript
interface CachedFurniture {
  query: string;
  style: string;
  results: FurnitureItem[];
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const FURNITURE_CACHE_KEY = 'real-furniture-cache';

export const findFurniture = async (
  query: string, 
  style: string, 
  budget: number | undefined
): Promise<FurnitureItem[]> => {
  const cacheKey = `${query}-${style}-${budget}`;
  
  // Check cache first
  try {
    const cached = localStorage.getItem(`${FURNITURE_CACHE_KEY}-${cacheKey}`);
    if (cached) {
      const parsed: CachedFurniture = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < CACHE_DURATION) {
        console.log('Using cached furniture results');
        return parsed.results;
      }
    }
  } catch (e) {
    console.warn('Cache read failed:', e);
  }
  
  // Perform web search (same as above)
  const results = await performWebSearch(query, style, budget);
  
  // Cache results
  try {
    localStorage.setItem(`${FURNITURE_CACHE_KEY}-${cacheKey}`, JSON.stringify({
      query,
      style,
      results,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
  
  return results;
};
```

## Alternative: Direct Web Scraping

If Gemini's web grounding doesn't work well, use a scraping service:

### Option A: ScraperAPI
```bash
npm install scraperapi-sdk
```

```typescript
import { ScraperAPI } from 'scraperapi-sdk';

const scraper = new ScraperAPI(process.env.SCRAPER_API_KEY);

async function scrapeWestElm(searchQuery: string) {
  const url = `https://www.westelm.com/search/results.html?words=${encodeURIComponent(searchQuery)}`;
  const html = await scraper.get(url);
  
  // Parse HTML to extract products
  // Use Gemini to structure the data
  const prompt = `Parse this HTML and extract furniture products with name, price, dimensions, image URL, and product URL:\n\n${html}`;
  
  const response = await ai.models.generateContent({
    model: AI_MODEL_FAST,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: realFurnitureSchema }
  });
  
  return JSON.parse(response.text);
}
```

### Option B: Bright Data (formerly Luminati)
More reliable but paid service for web scraping at scale.

## Testing

After implementation:
1. Search for "sofa" - should return real West Elm/CB2 sofas
2. Check prices match retailer websites
3. Click "Buy Now" - should open product page
4. Verify images are actual product photos

## Cost Optimization

1. **Cache aggressively**: 24-hour cache for products
2. **Batch requests**: Search multiple retailers in one prompt
3. **Fallback**: Use generated furniture if web search fails
4. **User feedback**: Let users report incorrect data

Would you like me to implement this right now?

