/**
 * Initialize OpenCV.js
 * Waits for the OpenCV library to load from CDN
 */

let opencvInitialized = false;

export async function initOpenCV(): Promise<void> {
  if (opencvInitialized) return;

  // Check if OpenCV is already loaded
  // @ts-ignore
  const cv = (window as any).cv;
  
  if (cv && cv.Mat) {
    opencvInitialized = true;
    console.log('✅ OpenCV.js already loaded');
    return;
  }

  // Wait for OpenCV to load
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('OpenCV.js failed to load within 30 seconds'));
    }, 30000);

    const checkInterval = setInterval(() => {
      // @ts-ignore
      const cv = (window as any).cv;
      
      if (cv && cv.Mat) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        opencvInitialized = true;
        console.log('✅ OpenCV.js loaded successfully');
        resolve();
      }
    }, 100);
  });
}

