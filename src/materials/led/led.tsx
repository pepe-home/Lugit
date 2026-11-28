import { useEffect, useId, useState } from 'react'
import { rasterizeText } from './pixel-font'

export type LedColour = 'amber' | 'red' | 'green' | 'white'

export const LED_COLOURS: Record<LedColour, { name: { zh: string; en: string }; hex: string }> = {
  amber: { name: { zh: '琥珀黄', en: 'Amber' }, hex: '#FFB000' },
  red: { name: { zh: '交通红', en: 'Red' }, hex: '#FF3B30' },
  green: { name: { zh: '荧光绿', en: 'Green' }, hex: '#39FF14' },
  white: { name: { zh: '暖白', en: 'White' }, hex: '#F2F2F2' },
}

const OFF_DOT = '#141414'
const PANEL = '#050505'
const BEZEL = '#1c1c1c'
/** 滚动速度：每秒移动多少个点（点阵屏常见的 8~12 字/秒）。 */
const SCROLL_DOTS_PER_SECOND = 14

interface Dot {
  x: number
  y: number
  /** 覆盖率 0..1，用于让非满像素的格显示为暗点。 */
  alpha: number
}

interface Rasterised {
  text: string
  cols: number
  dots: Dot[]
}

interface LedTextProps {
  text: string
  /** 相邻两个亮点中心的距离。 */
  pitch: number
  /** 文本左上角相对于屏幕左上角的坐标。 */
  x: number
  y: number
  colour: string
  /** 可见宽度。文本更宽且 `scroll` 为真时循环滚动。 */
  viewportWidth?: number
  scroll?: boolean
  align?: 'left' | 'center'
  /** 导出时使用静态帧。 */
  freeze?: boolean
  /** 中文为双宽字形，同一个点阵格对应两列。 */
  cell?: { width: number; height: number }
}

/**
 * 一段点阵文字。放在 `LedScreen` 里才能获得屏幕底色、未点亮网格与辉光。
 */
export const LedText = (props: LedTextProps) => {
  const {
    text,
    pitch,
    x,
    y,
    colour,
    viewportWidth,
    scroll,
    align = 'left',
    freeze,
    cell = { width: 1, height: 1 },
  } = props
  const [rasterised, setRasterised] = useState<Rasterised | null>(null)

  useEffect(() => {
    let cancelled = false
    rasterizeText(text)
      .then((bitmap) => {
        if (cancelled) return
        const dots: Dot[] = []
        for (let row = 0; row < bitmap.rows; row++) {
          for (let col = 0; col < bitmap.cols; col++) {
            const alpha = bitmap.cells[row * bitmap.cols + col] / 255
            if (alpha >= 0.2) dots.push({ x: col, y: row, alpha })
          }
        }
        setRasterised({ text, cols: bitmap.cols, dots })
      })
      .catch((err) => console.warn('LED 文字栅格化失败', text, err))
    return () => {
      cancelled = true
    }
  }, [text])

  const ready = rasterised?.text === text
  const cols = ready ? rasterised.cols : 0
  const dots = ready ? rasterised.dots : []
  const textWidth = cols * cell.width * pitch
  const vw = viewportWidth ?? textWidth
  const shouldScroll = !!scroll && !freeze && textWidth > vw
  const offset = align === 'center' && !shouldScroll ? Math.max(0, (vw - textWidth) / 2) : 0

  return (
    <g transform={`translate(${x + offset},${y})`}>
      <g
        className={shouldScroll ? 'metro-led-scroll' : undefined}
        style={
          shouldScroll
            ? ({
                '--led-vw': `${vw}px`,
                '--led-tw': `${textWidth}px`,
                '--led-duration': `${(textWidth + vw) / (pitch * SCROLL_DOTS_PER_SECOND)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x * pitch + pitch / 2}
            cy={dot.y * pitch + pitch / 2}
            r={pitch * 0.4}
            fill={colour}
            fillOpacity={0.35 + 0.65 * dot.alpha}
          />
        ))}
      </g>
    </g>
  )
}

interface LedScreenProps {
  x: number
  y: number
  width: number
  height: number
  pitch: number
  radius?: number
  /** 绘制未点亮点的网格。 */
  dimOff?: boolean
  /** 子元素坐标以屏幕左上角为原点。 */
  children: React.ReactNode
}

/**
 * LED 屏：黑色面板、金属边框、未点亮点阵与辉光滤镜。子元素会被裁剪在屏幕内。
 */
export const LedScreen = (props: LedScreenProps) => {
  const { x, y, width, height, pitch, radius = 10, dimOff = true, children } = props
  const rawId = useId().replace(/:/g, '')
  const clipId = `led-clip-${rawId}`
  const glowId = `led-glow-${rawId}`

  const cols = Math.floor(width / pitch)
  const rows = Math.floor(height / pitch)
  const padX = (width - cols * pitch) / 2
  const padY = (height - rows * pitch) / 2

  const offDots: React.ReactNode[] = []
  if (dimOff) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        offDots.push(
          <circle
            key={`${col}-${row}`}
            cx={x + padX + col * pitch + pitch / 2}
            cy={y + padY + row * pitch + pitch / 2}
            r={pitch * 0.3}
            fill={OFF_DOT}
          />,
        )
      }
    }
  }

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={radius} />
        </clipPath>
        <filter id={glowId} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={pitch * 0.45} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x={x - 8}
        y={y - 8}
        width={width + 16}
        height={height + 16}
        rx={radius + 8}
        fill={BEZEL}
      />
      <rect x={x} y={y} width={width} height={height} rx={radius} fill={PANEL} />

      <g clipPath={`url(#${clipId})`}>
        <g>{offDots}</g>
        <g transform={`translate(${x},${y})`} filter={`url(#${glowId})`}>
          {children}
        </g>
      </g>
    </g>
  )
}
