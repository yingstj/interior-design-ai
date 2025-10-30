import type { Project, PlacedFurnitureItem } from '../types';

export const exportCanvasAsImage = async (
  svgElement: SVGSVGElement,
  project: Project,
  format: 'png' | 'jpeg' = 'png'
): Promise<void> => {
  try {
    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create a canvas for rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Set canvas size - make it larger for better quality
    const scale = 2; // 2x for retina displays
    const width = svgElement.clientWidth * scale;
    const height = svgElement.clientHeight * scale;
    canvas.width = width;
    canvas.height = height;

    // Load and draw the SVG
    const img = new Image();
    img.onload = () => {
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw SVG
      ctx.drawImage(img, 0, 0, width, height);

      // Add overlay with project info
      addOverlay(ctx, project, width, height, scale);

      // Convert to desired format and download
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${project.name.replace(/\s/g, '-')}-${Date.now()}.${format}`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, mimeType, 0.95);

      URL.revokeObjectURL(svgUrl);
    };

    img.onerror = () => {
      console.error('Failed to load SVG');
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  } catch (error) {
    console.error('Error exporting canvas:', error);
    throw error;
  }
};

const addOverlay = (
  ctx: CanvasRenderingContext2D,
  project: Project,
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): void => {
  // Add semi-transparent overlay at bottom
  const overlayHeight = 250 * scale;
  const overlayY = canvasHeight - overlayHeight;

  // Draw overlay background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(0, overlayY, canvasWidth, overlayHeight);

  // Draw border
  ctx.strokeStyle = '#cbd5e0';
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(0, overlayY, canvasWidth, overlayHeight);

  // Set text properties
  ctx.fillStyle = '#1f2937';
  ctx.textBaseline = 'top';

  // Title
  ctx.font = `bold ${24 * scale}px sans-serif`;
  ctx.fillText(project.name, 20 * scale, overlayY + 20 * scale);

  // Room info
  ctx.font = `${14 * scale}px sans-serif`;
  ctx.fillStyle = '#4b5563';
  ctx.fillText(
    `Room: ${project.room.width}' × ${project.room.height}' | Style: ${project.stylePreference}`,
    20 * scale,
    overlayY + 55 * scale
  );

  // Furniture list
  ctx.font = `bold ${16 * scale}px sans-serif`;
  ctx.fillStyle = '#1f2937';
  ctx.fillText('Furniture:', 20 * scale, overlayY + 85 * scale);

  if (project.placedFurniture.length === 0) {
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('No furniture placed', 20 * scale, overlayY + 115 * scale);
  } else {
    ctx.font = `${12 * scale}px sans-serif`;
    const maxItems = 5;
    const items = project.placedFurniture.slice(0, maxItems);

    items.forEach((item, index) => {
      const y = overlayY + (115 + index * 22) * scale;
      ctx.fillStyle = '#4b5563';
      ctx.fillText(
        `• ${item.name} - ${item.width}" × ${item.depth}" - $${item.price.toLocaleString()}`,
        30 * scale,
        y
      );
    });

    if (project.placedFurniture.length > maxItems) {
      const y = overlayY + (115 + maxItems * 22) * scale;
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(
        `+ ${project.placedFurniture.length - maxItems} more items`,
        30 * scale,
        y
      );
    }
  }

  // Total cost
  const totalCost = project.cart.reduce((sum, item) => sum + item.price, 0);
  ctx.font = `bold ${14 * scale}px sans-serif`;
  ctx.fillStyle = '#059669';
  ctx.fillText(
    `Total in Cart: $${totalCost.toLocaleString()}`,
    canvasWidth - 250 * scale,
    overlayY + 20 * scale
  );

  // Timestamp
  ctx.font = `${11 * scale}px sans-serif`;
  ctx.fillStyle = '#9ca3af';
  const date = new Date().toLocaleString();
  ctx.fillText(
    `Exported: ${date}`,
    canvasWidth - 250 * scale,
    overlayY + 50 * scale
  );
};

