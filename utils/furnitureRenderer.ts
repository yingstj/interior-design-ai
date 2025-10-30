/**
 * Utility to generate bird's eye view SVG representations of furniture
 * These are embedded data URLs that can be used directly as image sources
 */

export type FurnitureType = 
  | 'sofa' | 'sectional' | 'couch' | 'loveseat'
  | 'chair' | 'armchair' | 'accent chair' | 'recliner'
  | 'table' | 'coffee table' | 'dining table' | 'side table' | 'end table' | 'console table'
  | 'desk' | 'office desk' | 'writing desk'
  | 'bed' | 'queen bed' | 'king bed' | 'twin bed' | 'full bed'
  | 'dresser' | 'chest' | 'nightstand' | 'credenza'
  | 'bookshelf' | 'bookcase' | 'shelf' | 'shelving'
  | 'ottoman' | 'bench' | 'stool'
  | 'cabinet' | 'wardrobe' | 'armoire'
  | 'tv stand' | 'media console'
  | 'rug' | 'carpet';

/**
 * Determines the furniture type from the item name
 */
export function detectFurnitureType(name: string): FurnitureType {
  const lowerName = name.toLowerCase();
  
  // Seating
  if (lowerName.includes('sectional') || lowerName.includes('l-shaped')) return 'sectional';
  if (lowerName.includes('loveseat')) return 'loveseat';
  if (lowerName.includes('sofa') || lowerName.includes('couch')) return 'sofa';
  if (lowerName.includes('armchair') || lowerName.includes('accent chair')) return 'armchair';
  if (lowerName.includes('recliner')) return 'recliner';
  if (lowerName.includes('chair')) return 'chair';
  if (lowerName.includes('ottoman')) return 'ottoman';
  if (lowerName.includes('bench')) return 'bench';
  if (lowerName.includes('stool')) return 'stool';
  
  // Tables
  if (lowerName.includes('coffee table')) return 'coffee table';
  if (lowerName.includes('dining table')) return 'dining table';
  if (lowerName.includes('side table') || lowerName.includes('end table')) return 'side table';
  if (lowerName.includes('console')) return 'console table';
  if (lowerName.includes('desk')) return 'desk';
  if (lowerName.includes('table')) return 'table';
  
  // Beds
  if (lowerName.includes('king bed') || lowerName.includes('king-size')) return 'king bed';
  if (lowerName.includes('queen bed') || lowerName.includes('queen-size')) return 'queen bed';
  if (lowerName.includes('full bed') || lowerName.includes('full-size')) return 'full bed';
  if (lowerName.includes('twin bed') || lowerName.includes('twin-size')) return 'twin bed';
  if (lowerName.includes('bed')) return 'bed';
  
  // Storage
  if (lowerName.includes('nightstand')) return 'nightstand';
  if (lowerName.includes('dresser')) return 'dresser';
  if (lowerName.includes('chest')) return 'chest';
  if (lowerName.includes('credenza')) return 'credenza';
  if (lowerName.includes('bookshelf') || lowerName.includes('bookcase')) return 'bookshelf';
  if (lowerName.includes('shelf') || lowerName.includes('shelving')) return 'shelf';
  if (lowerName.includes('wardrobe') || lowerName.includes('armoire')) return 'wardrobe';
  if (lowerName.includes('cabinet')) return 'cabinet';
  if (lowerName.includes('tv stand') || lowerName.includes('media console')) return 'tv stand';
  
  // Rugs
  if (lowerName.includes('rug') || lowerName.includes('carpet')) return 'rug';
  
  // Default
  return 'table';
}

/**
 * Generates an SVG bird's eye view representation of furniture
 */
export function generateFurnitureSVG(type: FurnitureType, color: string = '#8B7355'): string {
  const bgColor = '#f5f5f0'; // Light background
  const accentColor = '#A0826D'; // Lighter accent
  const darkColor = '#6B5744'; // Darker details
  
  let svg = '';
  
  switch (type) {
    case 'sofa':
    case 'couch':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <!-- Main seat -->
          <rect x="10" y="10" width="80" height="40" fill="${color}" rx="3"/>
          <!-- Back cushions -->
          <rect x="12" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="33" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="54" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="75" y="12" width="13" height="10" fill="${accentColor}" rx="2"/>
          <!-- Seat cushions -->
          <rect x="12" y="25" width="18" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <rect x="33" y="25" width="18" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <rect x="54" y="25" width="18" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <rect x="75" y="25" width="13" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <!-- Arms -->
          <rect x="7" y="10" width="6" height="40" fill="${darkColor}" rx="2"/>
          <rect x="87" y="10" width="6" height="40" fill="${darkColor}" rx="2"/>
        </svg>`;
      break;
      
    case 'sectional':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- L-shaped sectional -->
          <!-- Long part -->
          <rect x="10" y="10" width="80" height="35" fill="${color}" rx="3"/>
          <rect x="12" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="33" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="54" y="12" width="18" height="10" fill="${accentColor}" rx="2"/>
          <rect x="75" y="12" width="13" height="10" fill="${accentColor}" rx="2"/>
          <!-- Short part -->
          <rect x="55" y="42" width="35" height="48" fill="${color}" rx="3"/>
          <rect x="57" y="44" width="31" height="15" fill="${accentColor}" rx="2"/>
          <rect x="57" y="62" width="31" height="15" fill="${accentColor}" rx="2"/>
          <!-- Corner -->
          <rect x="55" y="35" width="35" height="10" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'loveseat':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="10" width="70" height="40" fill="${color}" rx="3"/>
          <rect x="17" y="12" width="30" height="10" fill="${accentColor}" rx="2"/>
          <rect x="51" y="12" width="30" height="10" fill="${accentColor}" rx="2"/>
          <rect x="17" y="25" width="30" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <rect x="51" y="25" width="30" height="22" fill="${accentColor}" rx="2" opacity="0.8"/>
          <rect x="12" y="10" width="5" height="40" fill="${darkColor}" rx="2"/>
          <rect x="83" y="10" width="5" height="40" fill="${darkColor}" rx="2"/>
        </svg>`;
      break;
      
    case 'chair':
    case 'armchair':
    case 'accent chair':
    case 'recliner':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Seat -->
          <rect x="25" y="25" width="50" height="50" fill="${color}" rx="3"/>
          <!-- Back -->
          <rect x="27" y="27" width="46" height="15" fill="${accentColor}" rx="2"/>
          <!-- Seat cushion -->
          <rect x="27" y="45" width="46" height="28" fill="${accentColor}" rx="2" opacity="0.8"/>
          <!-- Arms -->
          <rect x="20" y="25" width="8" height="50" fill="${darkColor}" rx="2"/>
          <rect x="72" y="25" width="8" height="50" fill="${darkColor}" rx="2"/>
        </svg>`;
      break;
      
    case 'coffee table':
    case 'table':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Tabletop -->
          <rect x="10" y="20" width="80" height="60" fill="${color}" rx="4"/>
          <!-- Wood grain effect -->
          <rect x="12" y="22" width="76" height="2" fill="${accentColor}" opacity="0.3" rx="1"/>
          <rect x="12" y="26" width="76" height="1" fill="${accentColor}" opacity="0.2" rx="1"/>
          <rect x="12" y="30" width="76" height="2" fill="${accentColor}" opacity="0.3" rx="1"/>
          <!-- Shadow/depth -->
          <rect x="10" y="78" width="80" height="4" fill="${darkColor}" opacity="0.5" rx="4"/>
          <!-- Legs -->
          <circle cx="18" cy="26" r="3" fill="${darkColor}"/>
          <circle cx="82" cy="26" r="3" fill="${darkColor}"/>
          <circle cx="18" cy="74" r="3" fill="${darkColor}"/>
          <circle cx="82" cy="74" r="3" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'dining table':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Tabletop -->
          <ellipse cx="50" cy="50" rx="45" ry="35" fill="${color}"/>
          <ellipse cx="50" cy="50" rx="43" ry="33" fill="${accentColor}" opacity="0.3"/>
          <!-- Centerpiece area -->
          <ellipse cx="50" cy="50" rx="15" ry="12" fill="${accentColor}" opacity="0.4"/>
          <!-- Legs -->
          <circle cx="25" cy="30" r="3" fill="${darkColor}"/>
          <circle cx="75" cy="30" r="3" fill="${darkColor}"/>
          <circle cx="25" cy="70" r="3" fill="${darkColor}"/>
          <circle cx="75" cy="70" r="3" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'side table':
    case 'end table':
    case 'nightstand':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Tabletop -->
          <rect x="20" y="20" width="60" height="60" fill="${color}" rx="3"/>
          <!-- Drawer -->
          <rect x="25" y="45" width="50" height="15" fill="${accentColor}" rx="2"/>
          <rect x="48" y="50" width="4" height="5" fill="${darkColor}" rx="1"/>
          <!-- Legs -->
          <circle cx="26" cy="26" r="2.5" fill="${darkColor}"/>
          <circle cx="74" cy="26" r="2.5" fill="${darkColor}"/>
          <circle cx="26" cy="74" r="2.5" fill="${darkColor}"/>
          <circle cx="74" cy="74" r="2.5" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'desk':
    case 'office desk':
    case 'writing desk':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <!-- Desktop -->
          <rect x="5" y="10" width="90" height="40" fill="${color}" rx="2"/>
          <!-- Drawers (left side) -->
          <rect x="8" y="18" width="20" height="10" fill="${accentColor}" rx="1"/>
          <rect x="10" y="21" width="2" height="4" fill="${darkColor}"/>
          <rect x="8" y="30" width="20" height="10" fill="${accentColor}" rx="1"/>
          <rect x="10" y="33" width="2" height="4" fill="${darkColor}"/>
          <!-- Keyboard area -->
          <rect x="35" y="25" width="35" height="15" fill="${accentColor}" opacity="0.3" rx="1"/>
        </svg>`;
      break;
      
    case 'bed':
    case 'queen bed':
    case 'king bed':
    case 'full bed':
    case 'twin bed':
      svg = `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Headboard -->
          <rect x="10" y="10" width="80" height="15" fill="${darkColor}" rx="3"/>
          <!-- Mattress -->
          <rect x="10" y="25" width="80" height="85" fill="${color}" rx="2"/>
          <!-- Bedding detail -->
          <rect x="12" y="27" width="76" height="40" fill="${accentColor}" opacity="0.4" rx="2"/>
          <!-- Pillows -->
          <rect x="15" y="30" width="30" height="15" fill="${accentColor}" rx="2"/>
          <rect x="55" y="30" width="30" height="15" fill="${accentColor}" rx="2"/>
        </svg>`;
      break;
      
    case 'dresser':
    case 'chest':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="10" width="70" height="80" fill="${color}" rx="2"/>
          <!-- Drawers -->
          <rect x="18" y="13" width="64" height="17" fill="${accentColor}" rx="1"/>
          <rect x="48" y="18" width="4" height="7" fill="${darkColor}" rx="1"/>
          <rect x="18" y="33" width="64" height="17" fill="${accentColor}" rx="1"/>
          <rect x="48" y="38" width="4" height="7" fill="${darkColor}" rx="1"/>
          <rect x="18" y="53" width="64" height="17" fill="${accentColor}" rx="1"/>
          <rect x="48" y="58" width="4" height="7" fill="${darkColor}" rx="1"/>
          <rect x="18" y="73" width="64" height="15" fill="${accentColor}" rx="1"/>
          <rect x="48" y="78" width="4" height="5" fill="${darkColor}" rx="1"/>
        </svg>`;
      break;
      
    case 'bookshelf':
    case 'bookcase':
    case 'shelf':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Frame -->
          <rect x="20" y="10" width="60" height="80" fill="${color}" rx="2"/>
          <!-- Shelves -->
          <rect x="22" y="25" width="56" height="3" fill="${darkColor}"/>
          <rect x="22" y="40" width="56" height="3" fill="${darkColor}"/>
          <rect x="22" y="55" width="56" height="3" fill="${darkColor}"/>
          <rect x="22" y="70" width="56" height="3" fill="${darkColor}"/>
          <!-- Books representation -->
          <rect x="24" y="13" width="8" height="10" fill="${accentColor}"/>
          <rect x="34" y="13" width="6" height="10" fill="${accentColor}" opacity="0.8"/>
          <rect x="42" y="13" width="10" height="10" fill="${accentColor}" opacity="0.6"/>
          <rect x="24" y="28" width="10" height="10" fill="${accentColor}" opacity="0.7"/>
          <rect x="36" y="28" width="8" height="10" fill="${accentColor}"/>
        </svg>`;
      break;
      
    case 'ottoman':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="25" width="50" height="50" fill="${color}" rx="4"/>
          <!-- Tufted pattern -->
          <circle cx="40" cy="40" r="3" fill="${accentColor}" opacity="0.5"/>
          <circle cx="60" cy="40" r="3" fill="${accentColor}" opacity="0.5"/>
          <circle cx="40" cy="60" r="3" fill="${accentColor}" opacity="0.5"/>
          <circle cx="60" cy="60" r="3" fill="${accentColor}" opacity="0.5"/>
          <circle cx="50" cy="50" r="3" fill="${accentColor}" opacity="0.5"/>
        </svg>`;
      break;
      
    case 'bench':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="20" width="80" height="25" fill="${color}" rx="2"/>
          <rect x="12" y="22" width="76" height="2" fill="${accentColor}" opacity="0.4"/>
          <!-- Legs -->
          <rect x="15" y="42" width="4" height="15" fill="${darkColor}"/>
          <rect x="81" y="42" width="4" height="15" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'console table':
    case 'credenza':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="15" width="90" height="30" fill="${color}" rx="2"/>
          <!-- Doors/compartments -->
          <rect x="8" y="18" width="26" height="24" fill="${accentColor}" rx="1"/>
          <rect x="37" y="18" width="26" height="24" fill="${accentColor}" rx="1"/>
          <rect x="66" y="18" width="26" height="24" fill="${accentColor}" rx="1"/>
          <!-- Handles -->
          <circle cx="21" cy="30" r="2" fill="${darkColor}"/>
          <circle cx="50" cy="30" r="2" fill="${darkColor}"/>
          <circle cx="79" cy="30" r="2" fill="${darkColor}"/>
        </svg>`;
      break;
      
    case 'cabinet':
    case 'wardrobe':
    case 'armoire':
      svg = `
        <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="10" width="60" height="100" fill="${color}" rx="2"/>
          <!-- Doors -->
          <rect x="22" y="12" width="27" height="96" fill="${accentColor}" rx="1"/>
          <rect x="51" y="12" width="27" height="96" fill="${accentColor}" rx="1"/>
          <!-- Handles -->
          <rect x="45" y="55" width="3" height="10" fill="${darkColor}" rx="1"/>
          <rect x="52" y="55" width="3" height="10" fill="${darkColor}" rx="1"/>
        </svg>`;
      break;
      
    case 'tv stand':
    case 'media console':
      svg = `
        <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="20" width="80" height="30" fill="${color}" rx="2"/>
          <!-- Shelves/compartments -->
          <rect x="13" y="23" width="22" height="24" fill="${accentColor}" rx="1"/>
          <rect x="39" y="23" width="22" height="24" fill="${accentColor}" rx="1"/>
          <rect x="65" y="23" width="22" height="24" fill="${accentColor}" rx="1"/>
          <!-- TV representation on top -->
          <rect x="25" y="10" width="50" height="8" fill="${darkColor}" opacity="0.3" rx="1"/>
        </svg>`;
      break;
      
    case 'rug':
    case 'carpet':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Main rug -->
          <rect x="10" y="10" width="80" height="80" fill="${color}" rx="2"/>
          <!-- Border pattern -->
          <rect x="12" y="12" width="76" height="76" fill="none" stroke="${accentColor}" stroke-width="3" rx="2"/>
          <rect x="16" y="16" width="68" height="68" fill="none" stroke="${accentColor}" stroke-width="1" rx="2"/>
          <!-- Center pattern -->
          <ellipse cx="50" cy="50" rx="20" ry="20" fill="${accentColor}" opacity="0.3"/>
          <ellipse cx="50" cy="50" rx="12" ry="12" fill="${accentColor}" opacity="0.4"/>
        </svg>`;
      break;
      
    case 'stool':
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Seat -->
          <circle cx="50" cy="50" r="25" fill="${color}"/>
          <circle cx="50" cy="50" r="23" fill="${accentColor}" opacity="0.4"/>
          <!-- Legs -->
          <line x1="50" y1="50" x2="35" y2="75" stroke="${darkColor}" stroke-width="3"/>
          <line x1="50" y1="50" x2="65" y2="75" stroke="${darkColor}" stroke-width="3"/>
          <line x1="50" y1="50" x2="50" y2="75" stroke="${darkColor}" stroke-width="3"/>
        </svg>`;
      break;
      
    default:
      // Generic furniture representation
      svg = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="60" height="60" fill="${color}" rx="4"/>
          <rect x="25" y="25" width="50" height="50" fill="${accentColor}" opacity="0.5" rx="2"/>
        </svg>`;
  }
  
  // Convert SVG to data URL
  const encodedSVG = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encodedSVG}`;
}

/**
 * Main function to get furniture image URL
 * First tries to use the provided imageUrl, falls back to generated SVG
 */
export function getFurnitureImageUrl(name: string, providedImageUrl?: string): string {
  // If a real product image URL is provided and looks valid, use it
  if (providedImageUrl && 
      !providedImageUrl.includes('picsum.photos') && 
      (providedImageUrl.startsWith('http://') || providedImageUrl.startsWith('https://'))) {
    return providedImageUrl;
  }
  
  // Otherwise, generate an SVG representation
  const furnitureType = detectFurnitureType(name);
  return generateFurnitureSVG(furnitureType);
}

