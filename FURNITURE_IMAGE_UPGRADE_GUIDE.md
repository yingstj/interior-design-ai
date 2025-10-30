# Furniture Image Upgrade Guide

## Current Implementation

All furniture images are generated through a single function in `services/geminiService.ts`:

```typescript
export const generateFurnitureImageUrl = (furnitureName: string, seed?: string): string => {
  const cleanName = furnitureName.replace(/\s/g, '-').toLowerCase();
  const seedValue = seed || cleanName;
  return `https://picsum.photos/seed/${seedValue}/${FURNITURE_IMAGE_SIZE}`;
};
```

**This is the ONLY place you need to change to upgrade to real furniture images!**

---

## Option 1: Unsplash API (Recommended for MVP) ⭐

**Best for**: Quick upgrade with high-quality, free furniture photos

### Setup

1. Get a free API key from [Unsplash Developers](https://unsplash.com/developers)
2. Add to `.env.local`:
   ```bash
   GEMINI_API_KEY=AIzaSyA0ql6Bz1fkNjBFOevAJoEBO6rQZix9w3k
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```

3. Update `vite.config.ts`:
   ```typescript
   define: {
     'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
     'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
     'process.env.UNSPLASH_ACCESS_KEY': JSON.stringify(env.UNSPLASH_ACCESS_KEY)
   },
   ```

### Implementation

Replace the `generateFurnitureImageUrl` function:

```typescript
export const generateFurnitureImageUrl = (furnitureName: string, seed?: string): string => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn('Unsplash API key not set, using placeholder');
    return `https://picsum.photos/seed/${seed || furnitureName}/${FURNITURE_IMAGE_SIZE}`;
  }
  
  // Search query: combine furniture name with "furniture" for better results
  const query = encodeURIComponent(`${furnitureName} furniture interior`);
  
  // Use Unsplash's random photo endpoint with search query
  return `https://source.unsplash.com/featured/${FURNITURE_IMAGE_SIZE}x${FURNITURE_IMAGE_SIZE}/?${query}`;
};
```

**Pros:**
- ✅ Free tier: 50 requests/hour
- ✅ High-quality, professional photos
- ✅ Simple to implement
- ✅ No backend needed

**Cons:**
- ⚠️ Rate limited
- ⚠️ Images may not always match exactly
- ⚠️ No pricing data

---

## Option 2: Pexels API (Alternative to Unsplash)

**Best for**: Similar to Unsplash with different image library

### Setup

1. Get API key from [Pexels API](https://www.pexels.com/api/)
2. Install pexels client: `npm install pexels`

### Implementation

```typescript
import { createClient } from 'pexels';

const pexelsClient = process.env.PEXELS_API_KEY 
  ? createClient(process.env.PEXELS_API_KEY) 
  : null;

export const generateFurnitureImageUrl = async (
  furnitureName: string, 
  seed?: string
): Promise<string> => {
  if (!pexelsClient) {
    return `https://picsum.photos/seed/${seed || furnitureName}/${FURNITURE_IMAGE_SIZE}`;
  }

  try {
    const query = `${furnitureName} furniture`;
    const result = await pexelsClient.photos.search({ query, per_page: 1 });
    
    if ('photos' in result && result.photos.length > 0) {
      return result.photos[0].src.medium;
    }
  } catch (error) {
    console.error('Pexels API error:', error);
  }
  
  // Fallback
  return `https://picsum.photos/seed/${seed || furnitureName}/${FURNITURE_IMAGE_SIZE}`;
};
```

**Note**: This makes the function async, requiring updates to all call sites.

---

## Option 3: Gemini Image Generation 🤖

**Best for**: AI-generated furniture images that match exact specifications

### Setup

Already have Gemini API key configured!

### Implementation

```typescript
import { GoogleGenAI } from "@google/genai";

export const generateFurnitureImageUrl = async (
  furnitureName: string,
  style?: string
): Promise<string> => {
  try {
    const prompt = `A high-quality product photo of a ${furnitureName}, ${style || 'modern'} style, professional furniture photography, clean white background, well-lit`;
    
    const response = await ai.models.generateImage({
      model: "gemini-2.5-pro-imagen",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
      }
    });

    // Get the image URL from response
    return response.images[0].url;
  } catch (error) {
    console.error('Image generation error:', error);
    // Fallback to placeholder
    return `https://picsum.photos/seed/${furnitureName}/${FURNITURE_IMAGE_SIZE}`;
  }
};
```

**Pros:**
- ✅ Exact match to furniture specifications
- ✅ Consistent style
- ✅ Already have API key
- ✅ Can include dimensions, style, color

**Cons:**
- ⚠️ Costs per image generation
- ⚠️ Slower than static images
- ⚠️ Need caching strategy

---

## Option 4: Furniture Retailer APIs (Production Grade) 💼

**Best for**: Real products with accurate pricing and purchase links

### Available APIs

#### IKEA API (Unofficial)
```typescript
export const generateFurnitureImageUrl = async (furnitureName: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://ikea-api.fly.dev/search?q=${encodeURIComponent(furnitureName)}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].image;
    }
  } catch (error) {
    console.error('IKEA API error:', error);
  }
  
  return `https://picsum.photos/seed/${furnitureName}/${FURNITURE_IMAGE_SIZE}`;
};
```

#### Wayfair, Target, Amazon APIs
Most major retailers require partnership agreements for API access.

**Pros:**
- ✅ Real products with real prices
- ✅ Can add "Buy Now" links
- ✅ Accurate dimensions
- ✅ User can actually purchase

**Cons:**
- ⚠️ Often requires business partnership
- ⚠️ Rate limits
- ⚠️ Multiple APIs needed for variety

---

## Option 5: Custom Database with Cloudinary/S3

**Best for**: Full control, curated furniture catalog

### Setup

1. Choose image hosting (Cloudinary, AWS S3, Supabase Storage)
2. Build furniture database with images
3. Store mappings in database

### Example with Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const generateFurnitureImageUrl = async (
  furnitureName: string,
  style: string
): Promise<string> => {
  try {
    // Query your furniture database
    const { data, error } = await supabase
      .from('furniture')
      .select('image_url')
      .ilike('name', `%${furnitureName}%`)
      .eq('style', style)
      .limit(1)
      .single();

    if (data && !error) {
      return data.image_url;
    }
  } catch (error) {
    console.error('Database error:', error);
  }
  
  return `https://picsum.photos/seed/${furnitureName}/${FURNITURE_IMAGE_SIZE}`;
};
```

**Pros:**
- ✅ Full control
- ✅ No rate limits
- ✅ Curated quality
- ✅ Can include detailed metadata

**Cons:**
- ⚠️ Requires building database
- ⚠️ Image sourcing/licensing
- ⚠️ Storage costs

---

## Recommended Upgrade Path

### For Quick MVP (Today):
**Use Unsplash API** - 5 minutes to implement, free, good quality

### For Production:
**Hybrid Approach:**
1. Primary: Retailer APIs (IKEA, etc.) for real products
2. Fallback: Unsplash for items not in catalog
3. Cache: Store URLs in localStorage to avoid re-fetching

---

## Implementation Steps (Unsplash - Quickest)

### 1. Get API Key
Visit: https://unsplash.com/developers

### 2. Update `.env.local`
```bash
GEMINI_API_KEY=AIzaSyA0ql6Bz1fkNjBFOevAJoEBO6rQZix9w3k
UNSPLASH_ACCESS_KEY=your_key_here
```

### 3. Update `vite.config.ts`
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.UNSPLASH_ACCESS_KEY': JSON.stringify(env.UNSPLASH_ACCESS_KEY)
},
```

### 4. Replace function in `services/geminiService.ts`
```typescript
export const generateFurnitureImageUrl = (furnitureName: string, seed?: string): string => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    console.warn('Unsplash API key not set, falling back to placeholder');
    const seedValue = seed || furnitureName.replace(/\s/g, '-').toLowerCase();
    return `https://picsum.photos/seed/${seedValue}/${FURNITURE_IMAGE_SIZE}`;
  }
  
  // Create search query for furniture
  const query = encodeURIComponent(`${furnitureName} furniture`);
  
  // Unsplash Source API - simple and doesn't require auth headers
  return `https://source.unsplash.com/${FURNITURE_IMAGE_SIZE}x${FURNITURE_IMAGE_SIZE}/?${query}`;
};
```

### 5. Restart dev server
```bash
npm run dev
```

**That's it!** Now you'll get real furniture photos from Unsplash.

---

## Advanced: Caching Strategy

To reduce API calls and improve performance:

```typescript
// Add to constants.ts
export const IMAGE_CACHE_KEY = 'furniture-image-cache';

// Create a caching wrapper
const imageCache = new Map<string, string>();

export const generateFurnitureImageUrl = (furnitureName: string, seed?: string): string => {
  const cacheKey = `${furnitureName}-${seed || 'default'}`;
  
  // Check memory cache
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  // Check localStorage
  const cached = localStorage.getItem(`${IMAGE_CACHE_KEY}-${cacheKey}`);
  if (cached) {
    imageCache.set(cacheKey, cached);
    return cached;
  }
  
  // Generate new URL
  const query = encodeURIComponent(`${furnitureName} furniture`);
  const url = `https://source.unsplash.com/${FURNITURE_IMAGE_SIZE}x${FURNITURE_IMAGE_SIZE}/?${query}`;
  
  // Cache it
  imageCache.set(cacheKey, url);
  localStorage.setItem(`${IMAGE_CACHE_KEY}-${cacheKey}`, url);
  
  return url;
};
```

---

## Testing

After implementing, test with:
1. Search for "modern sofa" - should show real sofa images
2. Try different furniture types - "dining table", "desk chair"
3. Check browser console for any API errors
4. Monitor API usage in your provider's dashboard

---

## Cost Estimates

- **Unsplash**: Free (50 req/hour)
- **Pexels**: Free (200 req/hour)
- **Gemini Images**: ~$0.02 per image
- **Cloudinary**: Free tier up to 25GB
- **AWS S3**: ~$0.023 per GB/month

---

## Questions?

Pick an option and I can help you implement it right now! 

**My recommendation**: Start with Unsplash (Option 1) - it's free, quick, and gives you real furniture images immediately.

