/**
 * 图像抠图模块 (Image Matting) — RMBG-1.4 风格
 *
 * RMBG-1.4 是 briaai 发布的通用背景移除模型，基于 U²-Net 架构。
 * 本模块在浏览器端实现了其核心思路的轻量近似：
 *   1. 多区域背景采样（边缘条带 + 四角 + 中心采样）
 *   2. 基于色彩距离的前景/背景二值分割
 *   3. 形态学膨胀/腐蚀去噪
 *   4. 边缘 alpha 羽化（模拟 trimap → alpha matting）
 *
 * 接口设计为可替换：未来可接入 ONNX Runtime 加载真正的 RMBG-1.4 ONNX 权重。
 */

export interface MattingOptions {
  maxWidth?: number
  thumbnailSize?: number
  /** 色彩距离容差（0-1，归一化），默认 0.12 */
  tolerance?: number
  quality?: number
  smoothEdges?: boolean
  /** 形态学操作迭代次数，默认 1 */
  morphIterations?: number
}

export interface MattingResult {
  url: string
  thumbnailUrl: string
  width: number
  height: number
}

// ── 工具函数 ──

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function rgbDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = (r1 - r2) / 255
  const dg = (g1 - g2) / 255
  const db = (b1 - b2) / 255
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// ── 1. 背景采样 ──

interface BgSample {
  r: number
  g: number
  b: number
  weight: number
}

function sampleBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): BgSample[] {
  const samples: BgSample[] = []
  const band = Math.max(3, Math.floor(Math.min(width, height) * 0.04))

  const add = (x: number, y: number, w: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const idx = (y * width + x) * 4
    samples.push({
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      weight: w,
    })
  }

  // 边缘条带采样（权重最高）
  for (let i = 0; i < width; i += Math.max(1, Math.floor(width / 40))) {
    for (let j = 0; j < band; j++) {
      add(i, j, 3)
      add(i, height - 1 - j, 3)
    }
  }
  for (let j = 0; j < height; j += Math.max(1, Math.floor(height / 40))) {
    for (let i = 0; i < band; i++) {
      add(i, j, 3)
      add(width - 1 - i, j, 3)
    }
  }

  // 四角
  const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  for (const [x, y] of corners) add(x, y, 2)

  return samples
}

// ── 2. 前景分割 ──

function segmentForeground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bgSamples: BgSample[],
  tolerance: number
): Float32Array {
  const alpha = new Float32Array(width * height)
  const totalWeight = bgSamples.reduce((s, c) => s + c.weight, 0)

  for (let pos = 0; pos < width * height; pos++) {
    const idx = pos * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]

    // 加权平均色彩距离
    let distSum = 0
    for (const s of bgSamples) {
      const d = rgbDistance(r, g, b, s.r, s.g, s.b)
      distSum += d * s.weight
    }
    const avgDist = distSum / totalWeight

    // 软分割：距离 < tolerance → 前景(1)，> tolerance*2 → 背景(0)，中间渐变
    if (avgDist < tolerance) {
      alpha[pos] = 1
    } else if (avgDist > tolerance * 2.5) {
      alpha[pos] = 0
    } else {
      alpha[pos] = 1 - (avgDist - tolerance) / (tolerance * 1.5)
    }
  }

  return alpha
}

// ── 3. 形态学操作（去噪） ──

function morphologicalClean(
  alpha: Float32Array,
  width: number,
  height: number,
  iterations: number
): Float32Array {
  let current = alpha

  for (let iter = 0; iter < iterations; iter++) {
    // 腐蚀（去掉细小噪点前景）
    const eroded = new Float32Array(width * height)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = y * width + x
        let min = 1
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            min = Math.min(min, current[(y + dy) * width + (x + dx)])
          }
        }
        eroded[pos] = min
      }
    }

    // 膨胀（恢复前景主体）
    const dilated = new Float32Array(width * height)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = y * width + x
        let max = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            max = Math.max(max, eroded[(y + dy) * width + (x + dx)])
          }
        }
        dilated[pos] = max
      }
    }

    current = dilated
  }

  return current
}

// ── 4. 边缘 alpha 羽化 ──

function featherEdges(
  alpha: Float32Array,
  width: number,
  height: number
): Float32Array {
  const result = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x
      const a = alpha[pos]

      // 对边缘像素（0 < a < 1）做高斯平滑
      if (a > 0 && a < 1) {
        let sum = 0
        let weight = 0
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const w = Math.exp(-(dx * dx + dy * dy) / 4)
            sum += alpha[ny * width + nx] * w
            weight += w
          }
        }
        result[pos] = sum / weight
      } else {
        result[pos] = a
      }
    }
  }

  return result
}

// ── 主函数 ──

export async function mattingImage(
  input: File | string,
  options: MattingOptions = {}
): Promise<MattingResult> {
  const {
    maxWidth = 800,
    thumbnailSize = 200,
    tolerance = 0.12,
    quality = 0.9,
    smoothEdges = true,
    morphIterations = 1,
  } = options

  const src = input instanceof File ? URL.createObjectURL(input) : input
  const img = await loadImage(src)
  if (input instanceof File) URL.revokeObjectURL(src)

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

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // 1. 背景采样
  const bgSamples = sampleBackground(data, w, h)

  // 2. 前景分割
  let alpha = segmentForeground(data, w, h, bgSamples, tolerance)

  // 3. 形态学去噪
  if (morphIterations > 0) {
    alpha = morphologicalClean(alpha, w, h, morphIterations)
  }

  // 4. 边缘羽化
  if (smoothEdges) {
    alpha = featherEdges(alpha, w, h)
  }

  // 写回 alpha 通道
  for (let i = 0; i < w * h; i++) {
    data[i * 4 + 3] = Math.round(alpha[i] * 255)
  }

  ctx.putImageData(imageData, 0, 0)

  const url = canvas.toDataURL('image/png', quality)

  // 缩略图（居中裁剪正方形，透明背景）
  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = thumbnailSize
  thumbCanvas.height = thumbnailSize
  const tCtx = thumbCanvas.getContext('2d')!
  tCtx.drawImage(canvas, 0, 0, w, h, 0, 0, thumbnailSize, thumbnailSize)
  const thumbnailUrl = thumbCanvas.toDataURL('image/png', 0.8)

  return { url, thumbnailUrl, width: w, height: h }
}

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
