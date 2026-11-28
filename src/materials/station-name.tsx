/**
 * 站名排版：中文一行（带字距），英文可在 `\` 处断行，最多 2 行。
 * 站名字号按字符数和可用宽度自动收缩，保证不溢出画布。
 */

import type { LocalisedText } from '@/core/model'

interface StationNameProps {
  name: LocalisedText
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
  /** 中文基准字号。 */
  zhSize: number
  /** 英文字号，默认中文的 0.38。 */
  enSize?: number
  /** 允许的最大宽度，用于自动收缩。 */
  maxWidth?: number
  colour?: string
  /** 中文与英文之间的行距。 */
  lineGap?: number
  /** 英文最多显示行数。 */
  maxEnLines?: number
  className?: string
}

export const StationName = (props: StationNameProps) => {
  const {
    name,
    x,
    y,
    anchor = 'middle',
    zhSize,
    enSize = Math.round(zhSize * 0.38),
    maxWidth,
    colour = '#111',
    lineGap = 1.18,
    maxEnLines = 2,
    className,
  } = props

  const zh = (name.zh ?? '').replaceAll('\\', '')
  const enLines = (name.en ?? '')
    .split('\\')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxEnLines)

  // 中文字数多时按可用宽度收缩（中文字宽约等于字号）
  const fitSize =
    maxWidth && zh.length > 0 ? Math.min(zhSize, maxWidth / (zh.length * 1.02)) : zhSize
  const zhLines = zh.length > 0 ? [zh] : []

  return (
    <g className={className} textAnchor={anchor} fill={colour}>
      {zhLines.map((line, i) => (
        <text
          key={`zh-${i}`}
          className="metro-name__zh"
          fontSize={fitSize}
          style={{ letterSpacing: fitSize > 18 ? '0.08em' : '0.04em' }}
          x={x}
          y={y + i * fitSize * lineGap}
        >
          {line}
        </text>
      ))}
      {enLines.map((line, i) => (
        <text
          key={`en-${i}`}
          className="metro-name__en"
          fontSize={enSize}
          x={x}
          y={y + zhLines.length * fitSize * lineGap + enSize * 0.9 + i * enSize * 1.15}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/**
 * 量出站名占用的高度（中文行数 + 英文行数）。
 */
export const measureNameHeight = (
  name: LocalisedText,
  zhSize: number,
  enSize = Math.round(zhSize * 0.38),
) => {
  const zhLines = (name.zh ?? '') ? 1 : 0
  const enLines = (name.en ?? '').split('\\').filter((s) => s.trim()).length
  return zhLines * zhSize * 1.18 + enLines * enSize * 1.15
}
