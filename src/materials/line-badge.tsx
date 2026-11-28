/**
 * 线路徽标：线色底 + 线名，常用于站名牌左下与路线图端点。
 * 形状为圆角矩形，与合肥轨道站名牌的色带一致。
 */

import type { Theme } from '@/core/model'

interface LineBadgeProps {
  name: { zh?: string; en?: string }
  theme: Theme
  x: number
  y: number
  width: number
  height: number
  /** 只显示中文线名（例如「1号线」省略「号」显示「1」）。 */
  compact?: boolean
  radius?: number
}

export const LineBadge = (props: LineBadgeProps) => {
  const {
    name,
    theme,
    x,
    y,
    width,
    height,
    compact = false,
    radius = Math.min(height / 4, 12),
  } = props
  const label = compact
    ? (name.zh ?? '').replace(/号线?$/, '').replace(/^S/, 'S') ||
      (name.en ?? '').replace(/^Line /, '')
    : (name.zh ?? '')
  const fontSize = compact
    ? Math.min(height * 0.62, width * 0.6)
    : Math.min(height * 0.5, (width * 0.9) / Math.max(1, label.length))

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={radius} fill={theme[2]} />
      <text
        className="metro-name__zh metro-name--bold"
        x={x + width / 2}
        y={y + height / 2 + fontSize * 0.36}
        fontSize={fontSize}
        fill={theme[3]}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}

/**
 * 换乘线路徽标：小一号，用于站名牌的换乘提示。
 */
interface InterchangeBadgesProps {
  lines: { name: { zh?: string; en?: string }; theme?: Theme }[]
  x: number
  y: number
  height?: number
  gap?: number
}

export const InterchangeBadges = (props: InterchangeBadgesProps) => {
  const { lines, x, y, height = 30, gap = 8 } = props
  let cursor = x
  return (
    <g>
      {lines.map((line, i) => {
        const label = line.name.zh ?? line.name.en ?? ''
        const width = Math.max(height * 1.6, label.length * height * 0.52 + height * 0.5)
        const el = (
          <LineBadge
            key={i}
            name={line.name}
            theme={line.theme ?? ['other', 'other', '#888888', '#fff']}
            x={cursor}
            y={y}
            width={width}
            height={height}
            radius={height / 4}
          />
        )
        cursor += width + gap
        return el
      })}
    </g>
  )
}
