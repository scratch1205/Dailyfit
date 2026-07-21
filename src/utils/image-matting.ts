/**
 * 图像抠图模块 (cv_unet_image-matting)
 *
 * 基于 cv_unet 风格的前景提取算法。
 * 当前实现使用 Canvas + 边缘检测 + 泛洪填充从背景中分离衣物前景，
 * 接口设计为可替换：未来可接入 ONNX/TFLite UNet 模型而无需改动调用方。
 *
 * 接口:
 *   mattingImage(file | imageData, options) -> Promise<{ url: string; thumbnailUrl: string }>
 */

export interface MattingOptions {
  /** 最大输出宽度（px），默认 800 */
  maxWidth?: number
  /** 缩略图尺寸（px），默认 200 */
  thumbnailSize?: number
  /** 背景相似度容差（0-255），默认 32 */
  tolerance?: number
  /** 输出质量（0-1），默认 0.85 */
  quality?: number
  /** 是否启用边缘平滑，默认 true */
  smoothEdges?: boolean
}

export interface MattingResult {
  url: string
  thumbnailUrl: string
  width: number
  height: number
}

/**
 * 从四角向内泛洪填充，移除与背景色相近的像素。
 */
function floodRemoveBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tolerance: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const visited = new Uint8Array(width * height)
  const stack: number[] = []

  // 从四角采样背景色
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
  const bgSamples: number[][] = []
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4
    bgSamples.push([data[idx], data[idx + 1], data[idx + 2]])
  }

  // 平均背景色
  const bg: [number, number, number] = [
    Math.round(bgSamples.reduce((s, c) => s + c[0], 0) / bgSamples.length),
    Math.round(bgSamples.reduce((s, c) => s + c[1], 0) / bgSamples.length),
    Math.round(bgSamples.reduce((s, c) => s + c[2], 0) / bgSamples.length),
  ]

  const isBg = (r: number, g: number, b: number): boolean => {
    return (
      Math.abs(r - bg[0]) <= tolerance &&
      Math.abs(g - bg[1]) <= tolerance &&
      Math.abs(b - bg[2]) <= tolerance
    )
  }

  // 从边界开始泛洪
  for (let x = 0; x < width; x++) {
    stack.push(x, 0)
    stack.push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    stack.push(0, y)
    stack.push(width - 1, y)
  }

  while (stack.length > 0) {
    const py = stack.pop()!
    const px = stack.pop()!
    if (px < 0 || px >= width || py < 0 || py >= height) continue
    const pos = py * width + px
    if (visited[pos]) continue
    const idx = pos * 4
    if (!isBg(data[idx], data[idx + 1], data[idx + 2])) continue

    visited[pos] = 1
    data[idx + 3] = 0 // 设为透明

    stack.push(px + 1, py)
    stack.push(px - 1, py)
    stack.push(px, py + 1)
    stack.push(px, py - 1)
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * 边缘平滑：对透明像素边界做 alpha 渐变，减少锯齿。
 */
function smoothAlphaEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const alphaMap = new Float32Array(width * height)

  for (let i = 0; i < width * height; i++) {
    alphaMap[i] = data[i * 4 + 3] / 255
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x
      if (alphaMap[pos] === 0 || alphaMap[pos] === 1) continue

      // 3x3 高斯加权平均 alpha
      let sum = 0
      let weight = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const w = dx === 0 && dy === 0 ? 4 : 1
          sum += alphaMap[(y + dy) * width + (x + dx)] * w
          weight += w
        }
      }
      data[pos * 4 + 3] = Math.round((sum / weight) * 255)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * 加载图片文件为 HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 抠图主函数：接收图片文件，返回去除背景后的 Base64 PNG（含透明通道）+ 缩略图。
 */
export async function mattingImage(
  input: File | string,
  options: MattingOptions = {}
): Promise<MattingResult> {
  const {
    maxWidth = 800,
    thumbnailSize = 200,
    tolerance = 32,
    quality = 0.85,
    smoothEdges = true,
  } = options

  const src = input instanceof File ? URL.createObjectURL(input) : input
  const img = await loadImage(src)
  if (input instanceof File) URL.revokeObjectURL(src)

  // 缩放至 maxWidth
  let { naturalWidth: w, naturalHeight: h } = img
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  // 背景移除
  floodRemoveBackground(ctx, w, h, tolerance)

  // 边缘平滑
  if (smoothEdges) {
    smoothAlphaEdges(ctx, w, h)
  }

  const url = canvas.toDataURL('image/png', quality)

  // 生成缩略图（居中裁剪正方形）
  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = thumbnailSize
  thumbCanvas.height = thumbnailSize
  const tCtx = thumbCanvas.getContext('2d')!
  tCtx.drawImage(canvas, 0, 0, w, h, 0, 0, thumbnailSize, thumbnailSize)
  const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.75)

  return { url, thumbnailUrl, width: w, height: h }
}

/**
 * 压缩图片（不抠图），用于不需要抠图的场景。
 */
export async function compressImage(
  file: File,
  maxWidth = 800
): Promise<{ url: string; thumbnailUrl: string }> {
  const src = URL.createObjectURL(file)
  const img = await loadImage(src)
  URL.revokeObjectURL(src)

  let { naturalWidth: w, naturalHeight: h } = img
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const url = canvas.toDataURL('image/jpeg', 0.8)

  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = 200
  thumbCanvas.height = 200
  const tCtx = thumbCanvas.getContext('2d')!
  const scale = Math.max(200 / w, 200 / h)
  const sw = w * scale
  const sh = h * scale
  tCtx.drawImage(canvas, (200 - sw) / 2, (200 - sh) / 2, sw, sh)
  const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7)

  return { url, thumbnailUrl }
}


export { mattingImage, compressImage }