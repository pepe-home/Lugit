/**
 * 导出：把物料 SVG 序列化为 PNG 或直接下载 SVG。
 *
 * PNG 走「序列化 → Image → canvas → toBlob」，与 rmg 的 `test()` 思路一致；
 * 区别是物料的所有样式都内联或定义在应用自身的样式表里，不依赖额外的 `share_*.css`。
 */

const INLINE_PROPS = [
  'font-family',
  'font-size',
  'font-weight',
  'fill',
  'stroke',
  'text-anchor',
  'dominant-baseline',
] as const

const serialize = (element: SVGSVGElement): string => {
  const clone = element.cloneNode(true) as SVGSVGElement
  // 把计算样式内联，保证脱离文档后渲染一致
  const sources = element.querySelectorAll<SVGElement>('text')
  const targets = clone.querySelectorAll<SVGElement>('text')
  targets.forEach((target, i) => {
    const source = sources[i]
    if (!source) return
    const computed = window.getComputedStyle(source)
    for (const prop of INLINE_PROPS) {
      const value = computed.getPropertyValue(prop)
      if (value) target.style.setProperty(prop, value)
    }
  })
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const exportSvg = (element: SVGSVGElement, filename: string) => {
  downloadBlob(new Blob([serialize(element)], { type: 'image/svg+xml' }), `${filename}.svg`)
}

export const exportPng = async (
  element: SVGSVGElement,
  filename: string,
  scale = 2,
): Promise<void> => {
  const viewBox = element.viewBox.baseVal
  const width = Math.round(viewBox.width * scale)
  const height = Math.round(viewBox.height * scale)
  const svgText = serialize(element)
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`

  const image = new Image()
  image.decoding = 'sync'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('SVG 图像加载失败'))
    image.src = dataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建导出画布')
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 编码失败')
  downloadBlob(blob, `${filename}.png`)
}
