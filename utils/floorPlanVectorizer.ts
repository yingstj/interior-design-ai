import { initOpenCV } from './opencvInit'
import { createWorker } from 'tesseract.js'
import initPotrace, { trace as potraceTrace } from 'potrace-wasm'

export type VectorizeResult = {
  svg: string
  width: number
  height: number
}

async function waitForCV(): Promise<void> {
  // @ts-ignore
  const cv = (window as any).cv
  if (cv?.Mat) return
  await new Promise<void>((resolve) => {
    const t = setInterval(() => {
      // @ts-ignore
      if ((window as any).cv?.Mat) { clearInterval(t); resolve() }
    }, 50)
  })
}

function autoDeskew(cv: any, bgr: any) {
  const gray = new cv.Mat(); cv.cvtColor(bgr, gray, cv.COLOR_BGR2GRAY)
  const blur = new cv.Mat(); cv.GaussianBlur(gray, blur, new cv.Size(3,3), 0)
  const edges = new cv.Mat(); cv.Canny(blur, edges, 60, 180)
  const lines = new cv.Mat(); cv.HoughLinesP(edges, lines, 1, Math.PI/180, 120, 80, 15)

  let angle = 0
  if (lines.rows > 5) {
    const angs:number[] = []
    for (let i=0;i<lines.rows;i++){
      const p = lines.intPtr(i); const x1=p[0], y1=p[1], x2=p[2], y2=p[3]
      let deg = Math.atan2(y2 - y1, x2 - x1) * 180/Math.PI
      if (deg > 45) deg -= 90; if (deg < -45) deg += 90
      angs.push(deg)
    }
    angs.sort((a,b)=>a-b)
    angle = angs.length % 2 ? angs[(angs.length-1)/2] : (angs[angs.length/2-1] + angs[angs.length/2]) / 2
    if (Math.abs(angle) < 0.3) angle = 0
  }

  if (angle !== 0) {
    const center = new cv.Point(bgr.cols/2, bgr.rows/2)
    const M = cv.getRotationMatrix2D(center, angle, 1)
    const rotated = new cv.Mat()
    cv.warpAffine(bgr, rotated, M, new cv.Size(bgr.cols,bgr.rows), cv.INTER_LINEAR, cv.BORDER_REPLICATE)
    gray.delete(); blur.delete(); edges.delete(); lines.delete(); bgr.delete()
    return rotated
  }

  gray.delete(); blur.delete(); edges.delete(); lines.delete()
  return bgr
}

function chooseThreshold(cv:any, gray:any) {
  const adaptive = new cv.Mat()
  cv.adaptiveThreshold(gray, adaptive, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 41, 10)

  const gb = new cv.Mat(); cv.GaussianBlur(gray, gb, new cv.Size(3,3), 0)
  const otsu = new cv.Mat(); cv.threshold(gb, otsu, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU)

  const score = (bw:any)=>{ const e=new cv.Mat(); cv.Canny(bw,e,50,150); const s=cv.countNonZero(e); e.delete(); return s }
  const pick = score(adaptive) >= score(otsu) ? adaptive : otsu

  gb.delete(); if (pick!==adaptive) adaptive.delete(); if (pick!==otsu) otsu.delete()
  return pick
}

async function ocrWordBoxes(bgr: any, dpi=320, minConf=55) {
  // @ts-ignore
  const cv = (window as any).cv
  const rgb = new cv.Mat(); cv.cvtColor(bgr, rgb, cv.COLOR_BGR2RGB)

  const c = document.createElement('canvas'); c.width = rgb.cols; c.height = rgb.rows
  cv.imshow(c, rgb); rgb.delete()

  const worker = await createWorker('eng', 1, {
    logger: () => {}
  }) as any;
  
  await worker.setParameters({ user_defined_dpi: String(dpi), preserve_interword_spaces: '1' })

  const { data } = await worker.recognize(c)
  await worker.terminate()

  const boxes: {x0:number,y0:number,x1:number,y1:number}[] = []
  const words = (data as any).words || []
  words.forEach((w:any) => {
    const conf = Number(w.conf ?? 0)
    if (conf >= minConf && (w.text || '').trim()) {
      boxes.push({ x0:w.bbox.x0, y0:w.bbox.y0, x1:w.bbox.x1, y1:w.bbox.y1 })
    }
  })

  return boxes
}

async function applyTextMaskBeforeTrace(cv:any, bw:any, bgr:any, wallThicken=2) {
  const boxes = await ocrWordBoxes(bgr)

  const mask = new cv.Mat.zeros(bw.rows, bw.cols, cv.CV_8UC1)
  boxes.forEach(({x0,y0,x1,y1}) => {
    const rect = new cv.Rect(x0, y0, x1-x0, y1-y0)
    const roi = mask.roi(rect); roi.setTo(new cv.Scalar(255)); roi.delete()
  })

  const invText = new cv.Mat(); cv.bitwise_not(mask, invText)
  const noText = new cv.Mat(); cv.bitwise_and(bw, invText, noText)
  mask.delete(); invText.delete()

  let chosen = noText
  if (wallThicken>0){
    const k = 1 + 2*wallThicken
    const ker = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(k,k))
    const dil = new cv.Mat(); cv.dilate(noText, dil, ker)
    noText.delete(); chosen = dil
  }

  const inv = new cv.Mat(); cv.bitwise_not(chosen, inv); chosen.delete()
  return inv // white bg, black lines
}

async function matToPngBlob(mat:any): Promise<Blob> {
  const c = document.createElement('canvas'); c.width = mat.cols; c.height = mat.rows
  const ctx = c.getContext('2d')!

  const imageData = new ImageData(mat.cols, mat.rows)
  for (let y=0;y<mat.rows;y++){
    for (let x=0;x<mat.cols;x++){
      const v = mat.ucharAt(y,x)
      const i = (y*mat.cols + x)*4
      imageData.data[i]=v; imageData.data[i+1]=v; imageData.data[i+2]=v; imageData.data[i+3]=255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return await new Promise(res => c.toBlob(b => res(b!), 'image/png'))
}

export async function vectorizeFloorPlan(file: File): Promise<VectorizeResult> {
  await initOpenCV()
  await waitForCV()
  await initPotrace()

  const img = await createImageBitmap(file)
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0)

  // @ts-ignore
  const cv = (window as any).cv
  const src = cv.imread(c)

  let bgr = new cv.Mat(); cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR)

  // 1) deskew
  bgr = autoDeskew(cv, bgr)

  // 2) gray + denoise
  const gray = new cv.Mat(); cv.cvtColor(bgr, gray, cv.COLOR_BGR2GRAY)
  const den = new cv.Mat(); cv.bilateralFilter(gray, den, 5, 25, 25, cv.BORDER_DEFAULT)

  // 3) dual threshold pick
  let chosen = chooseThreshold(cv, den)

  // 4) mask text before tracing + gentle dilation + invert
  const bw255 = await applyTextMaskBeforeTrace(cv, chosen, bgr, 2)

  // 5) Potrace → SVG
  const pngBlob = await matToPngBlob(bw255)
  const buf = new Uint8Array(await pngBlob.arrayBuffer())
  const rawSvg = await potraceTrace(buf, { turdsize:3, alphamax:0.8, opttolerance:0.2, turnpolicy:'minority' })

  // normalize SVG
  const doc = new DOMParser().parseFromString(rawSvg, 'image/svg+xml')
  const root = doc.documentElement

  root.setAttribute('viewBox', `0 0 ${bw255.cols} ${bw255.rows}`)
  root.setAttribute('width', `${bw255.cols}px`)
  root.setAttribute('height', `${bw255.rows}px`)

  doc.querySelectorAll('path').forEach((p:any) => {
    p.setAttribute('stroke', '#000')
    if (p.hasAttribute('fill')) p.setAttribute('fill', '#000')
  })

  const svg = new XMLSerializer().serializeToString(doc)

  // cleanup
  src.delete(); gray.delete(); den.delete(); bgr.delete(); bw255.delete()

  return { svg, width: img.width, height: img.height }
}
