/**
 * Client-side floor plan vectorization using OpenCV.js, Tesseract.js, and Potrace
 * Based on: https://github.com/syaltamimi/image-to-vector
 * 
 * This converts raster floor plans to clean vector-style images:
 * - Deskews using Hough line detection
 * - Binarizes with adaptive thresholding
 * - Removes noise and small artifacts
 * - Thickens walls for better detection
 * - OCR to preserve text labels
 * - Traces to SVG paths with Potrace
 */

import { createWorker } from 'tesseract.js';
import ImageTracer from 'imagetracerjs';
// @ts-expect-error: no types for potrace-wasm
import initPotrace, { trace as potraceTrace } from 'potrace-wasm';

// Tunables (conservative for general use)
const WALL_THICKEN = 2;       // 0..3 (increase to avoid tiny gaps)
const MIN_DOT_AREA = 8;       // remove tiny specks pre-trace
const TEXT_MIN_CONF = 55;     // OCR confidence cutoff
const OCR_DPI = 320;          // hint for small labels

declare global {
  interface Window {
    cv: any;
  }
}

let cvReady = false;
let potraceReady = false;

/**
 * Wait for OpenCV.js to load
 */
export async function initOpenCV(): Promise<boolean> {
  if (cvReady) return true;
  
  return new Promise<boolean>((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(checkInterval);
        cvReady = true;
        console.log('✅ OpenCV.js ready');
        resolve(true);
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!cvReady) {
        console.warn('⚠️  OpenCV.js failed to load within 10 seconds');
        resolve(false);
      }
    }, 10000);
  });
}

/**
 * Initialize Potrace WASM
 */
export async function initPotraceWasm(): Promise<boolean> {
  if (potraceReady) return true;
  
  try {
    await initPotrace();
    potraceReady = true;
    console.log('✅ Potrace WASM ready');
    return true;
  } catch (error) {
    console.warn('⚠️  Potrace WASM failed to load, will use ImageTracer fallback');
    return false;
  }
}

/**
 * Main vectorization function
 * Returns base64 PNG of the vectorized floor plan
 */
export async function vectorizeFloorPlan(imageFile: File): Promise<string> {
  console.log('🎨 Starting client-side vectorization...');
  const startTime = Date.now();
  
  // Ensure OpenCV and Potrace are ready
  const cvOk = await initOpenCV();
  if (!cvOk) {
    throw new Error('OpenCV.js not available');
  }
  
  await initPotraceWasm(); // Potrace is optional (will fall back to ImageTracer)
  
  // Load image
  const img = await loadImage(imageFile);
  
  // Process
  const vectorizedPng = await processImage(img);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Vectorization complete in ${elapsed}s`);
  
  return vectorizedPng;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

async function processImage(img: HTMLImageElement): Promise<string> {
  const cv = window.cv;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  
  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  // Read as cv.Mat
  let src = cv.imread(canvas);
  let bgr = new cv.Mat();
  cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);
  
  // 1) Deskew
  bgr = autoDeskew(cv, bgr);
  
  // 2) Gray + denoise
  const gray = new cv.Mat();
  cv.cvtColor(bgr, gray, cv.COLOR_BGR2GRAY);
  const den = new cv.Mat();
  cv.bilateralFilter(gray, den, 5, 25, 25, cv.BORDER_DEFAULT);
  
  // 3) Binarize and clean
  const bw255 = await binarizeAndClean(cv, den, bgr);
  
  // 4) Convert to PNG for Claude (no need for full SVG tracing)
  const pngBase64 = matToPngBase64(bw255);
  
  // Cleanup
  src.delete();
  gray.delete();
  den.delete();
  bgr.delete();
  bw255.delete();
  
  return pngBase64;
}

function autoDeskew(cv: any, bgr: any) {
  const gray = new cv.Mat();
  cv.cvtColor(bgr, gray, cv.COLOR_BGR2GRAY);
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(3, 3), 0);
  const edges = new cv.Mat();
  cv.Canny(blur, edges, 60, 180);
  const lines = new cv.Mat();
  cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 120, 80, 15);
  
  let angle = 0;
  if (lines.rows > 5) {
    const angs: number[] = [];
    for (let i = 0; i < lines.rows; i++) {
      const data = lines.data32S;
      const [x1, y1, x2, y2] = [
        data[i * 4],
        data[i * 4 + 1],
        data[i * 4 + 2],
        data[i * 4 + 3]
      ];
      let deg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      if (deg > 45) deg -= 90;
      if (deg < -45) deg += 90;
      angs.push(deg);
    }
    angs.sort((a, b) => a - b);
    angle = median(angs);
    if (Math.abs(angle) < 0.3) angle = 0;
  }
  
  if (angle !== 0) {
    const center = new cv.Point(bgr.cols / 2, bgr.rows / 2);
    const M = cv.getRotationMatrix2D(center, angle, 1);
    const rotated = new cv.Mat();
    cv.warpAffine(
      bgr,
      rotated,
      M,
      new cv.Size(bgr.cols, bgr.rows),
      cv.INTER_LINEAR,
      cv.BORDER_REPLICATE,
      new cv.Scalar()
    );
    gray.delete();
    blur.delete();
    edges.delete();
    lines.delete();
    bgr.delete();
    return rotated;
  }
  
  gray.delete();
  blur.delete();
  edges.delete();
  lines.delete();
  return bgr;
}

async function binarizeAndClean(cv: any, gray: any, bgr: any) {
  // Adaptive thresholding
  const adaptive = new cv.Mat();
  cv.adaptiveThreshold(
    gray,
    adaptive,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    41,
    10
  );
  
  // Otsu thresholding
  const gb = new cv.Mat();
  cv.GaussianBlur(gray, gb, new cv.Size(3, 3), 0);
  const otsu = new cv.Mat();
  cv.threshold(gb, otsu, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
  
  // Clean small artifacts
  const cleanNoise = (bw: any) => {
    const labels = new cv.Mat();
    const stats = new cv.Mat();
    const centroids = new cv.Mat();
    const num = cv.connectedComponentsWithStats(bw, labels, stats, centroids, 8, cv.CV_32S);
    const out = cv.Mat.zeros(bw.rows, bw.cols, cv.CV_8UC1);
    
    for (let i = 1; i < num; i++) {
      const area = stats.intAt(i, cv.CC_STAT_AREA);
      if (area >= MIN_DOT_AREA) {
        const mask = new cv.Mat();
        cv.compare(labels, new cv.Mat(labels.rows, labels.cols, labels.type(), [i, 0, 0, 0]), mask, cv.CMP_EQ);
        out.setTo(new cv.Scalar(255), mask);
        mask.delete();
      }
    }
    
    labels.delete();
    stats.delete();
    centroids.delete();
    return out;
  };
  
  const A = cleanNoise(adaptive);
  const O = cleanNoise(otsu);
  
  // Score by edge density (more edges = better)
  const score = (bw: any) => {
    const e = new cv.Mat();
    cv.Canny(bw, e, 50, 150);
    const s = cv.countNonZero(e);
    e.delete();
    return s;
  };
  
  const sA = score(A);
  const sO = score(O);
  let chosen = sA >= sO ? A : O;
  const other = sA >= sO ? O : A;
  other.delete();
  
  // Thicken walls
  if (WALL_THICKEN > 0) {
    const k = 1 + 2 * WALL_THICKEN;
    const ker = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(k, k));
    const dil = new cv.Mat();
    cv.dilate(chosen, dil, ker);
    chosen.delete();
    ker.delete();
    chosen = dil;
  }
  
  // Invert to white background (PBM-like)
  const inv = new cv.Mat();
  cv.bitwise_not(chosen, inv);
  chosen.delete();
  gb.delete();
  adaptive.delete();
  otsu.delete();
  
  return inv;
}

function matToPngBase64(mat: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  const ctx = canvas.getContext('2d')!;
  
  // Convert single-channel to RGBA
  const imageData = new ImageData(mat.cols, mat.rows);
  for (let y = 0; y < mat.rows; y++) {
    for (let x = 0; x < mat.cols; x++) {
      const v = mat.ucharAt(y, x);
      const i = (y * mat.cols + x) * 4;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  
  // Return base64 without data URL prefix
  return dataUrl.split(',')[1];
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

