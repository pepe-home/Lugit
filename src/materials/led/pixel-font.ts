/**
 * LED 点阵渲染。
 *
 * 文字用像素字体（Fusion Pixel 12px，OFL-1.1）栅格化成 1 位点阵，每个亮点的坐标
 * 直接映射成 SVG 圆点，因此屏幕在任何缩放和导出尺寸下都是精确的「点阵」。
 * 只依赖 `document.createElement('canvas')` 与 `CanvasRenderingContext2D`，
 * 在 SVG 序列化后不影响导出。
 */

/** 像素字体族名。带引号是为了让 CSS 数值名称不被当成关键字解析。 */
export const LED_FONT_FAMILY = '"FusionPixel12"'
export const LED_FONT_SIZE = 12

let fontPromise: Promise<void> | null = null

/**
 * 加载像素字体并注册到 `document.fonts`。重复调用只加载一次；失败时允许重试。
 */
export const ensureLedFont = (): Promise<void> => {
  if (fontPromise) return fontPromise
  fontPromise = (async () => {
    if (typeof document === 'undefined') return
    if (document.fonts.check(`${LED_FONT_SIZE}px ${LED_FONT_FAMILY}`)) return
    const url = `${import.meta.env.BASE_URL}fonts/led/fusion-pixel-12px-monospaced-zh_hans.woff2`
    const face = new FontFace(LED_FONT_FAMILY, `url("${url}")`)
    await face.load()
    document.fonts.add(face)
  })().catch((err) => {
    fontPromise = null
    throw err
  })
  return fontPromise
}

export interface BitmapText {
  cols: number
  rows: number
  /** 每个点阵格的覆盖率 0..255，`cells[y * cols + x]`。 */
  cells: Uint8Array
}

const cache = new Map<string, BitmapText>()
const MAX_CACHE = 512

/**
 * 把文字栅格化成点阵，尺寸即像素字体的原始像素尺寸。
 */
export const rasterizeText = async (text: string): Promise<BitmapText> => {
  const hit = cache.get(text)
  if (hit) return hit

  await ensureLedFont()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法创建用于 LED 文字的 2D 画布')

  const font = `${LED_FONT_SIZE}px ${LED_FONT_FAMILY}`
  ctx.font = font
  const cols = Math.max(1, Math.ceil(ctx.measureText(text || ' ').width))
  const rows = LED_FONT_SIZE
  canvas.width = cols
  canvas.height = rows

  // 调整画布尺寸会重置上下文状态
  ctx.font = font
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#000'
  ctx.fillText(text, 0, 0)

  const data = ctx.getImageData(0, 0, cols, rows).data
  const cells = new Uint8Array(cols * rows)
  for (let i = 0; i < cols * rows; i++) {
    cells[i] = data[i * 4 + 3]
  }

  const bitmap = { cols, rows, cells }
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(text, bitmap)
  return bitmap
}

export const clearBitmapCache = () => cache.clear()
