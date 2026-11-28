/**
 * 线路示意：线网工作区的预览画布，单线横向条图。
 *
 * 站点坐标由 `core/layout` 按关键路径法等距计算，支线向下偏移；
 * 当前站高亮、已过站置灰、未到站用线色，便于在编辑站点时即时看到结果。
 * 线路示意不是车站物料，因此不参与车站物料导出。
 */

import { layoutLine, getStationStates } from '@/core/layout'
import { getMaterialInfo } from '@/core/material'
import type { Line, Network, Station, StationPov, Theme } from '@/core/model'
import { MaterialCanvas } from './canvas'
import { InterchangeBadges, LineBadge } from './line-badge'
import { StationName } from './station-name'

export interface LineMapProps {
  network: Network
  pov: StationPov
  width: number
  height: number
  theme: Theme
}

const LINE_WIDTH = 12
const PASSED = '#c4c4c4'
const FONT_ZH = 18

export const LineMap = (props: LineMapProps) => {
  const { network, pov, width, height, theme } = props
  const info = getMaterialInfo(network, pov)
  const line = info.line
  const stations = network.stations

  const padding = 5
  const endMargin = Math.max(90, width * 0.05)
  const layout = layoutLine(line, {
    width,
    height,
    padding,
    yPercent: 66,
    branchSpacing: 22,
    endMargin,
  })

  const ordered = [...layout.mainPath, ...layout.branches.flat()]
  const states = getStationStates(info.route, pov.currentStationId)
  const passedSet = new Set(info.passed)

  const linePath = buildPath(
    ordered.filter((id) => layout.xs[id] !== undefined),
    layout.xs,
    layout.ys,
  )

  return (
    <MaterialCanvas kind="line-map" width={width} height={height} theme={theme}>
      <Header line={line} width={width} height={height} info={info} />

      <path
        d={linePath}
        fill="none"
        stroke="var(--metro-line-colour)"
        strokeWidth={LINE_WIDTH}
        strokeLinejoin="round"
      />
      {line.branches?.map((branch, i) => (
        <path
          key={i}
          d={buildPath(branch, layout.xs, layout.ys)}
          fill="none"
          stroke="var(--metro-line-colour)"
          strokeWidth={LINE_WIDTH}
          strokeLinejoin="round"
        />
      ))}

      {ordered.map((id) => {
        const station = stations[id]
        if (!station || layout.xs[id] === undefined) return null
        const passed = passedSet.has(id)
        const current = states[id] === 0
        return (
          <StationMark
            key={id}
            station={station}
            x={layout.xs[id]}
            y={layout.ys[id]}
            current={current}
            passed={passed}
            theme={theme}
          />
        )
      })}
    </MaterialCanvas>
  )
}

interface HeaderProps {
  line: Line
  width: number
  height: number
  info: ReturnType<typeof getMaterialInfo>
}

const Header = (props: HeaderProps) => {
  const { line, width, height, info } = props
  const badgeW = Math.max(120, width * 0.07)
  const badgeH = height * 0.13
  const y = height * 0.1

  return (
    <g>
      <LineBadge
        name={line.name}
        theme={line.theme}
        x={width * 0.03}
        y={y - badgeH / 2}
        width={badgeW}
        height={badgeH}
      />
      <text
        className="metro-name__zh metro-name--bold"
        x={width * 0.03 + badgeW + 18}
        y={y + badgeH * 0.16}
        fontSize={badgeH * 0.62}
        fill="#111"
      >
        {line.name.zh} 线路示意
      </text>
      <text
        className="metro-name__en"
        x={width * 0.03 + badgeW + 20}
        y={y + badgeH * 0.62}
        fontSize={badgeH * 0.24}
        fill="#777"
      >
        {line.name.en} Line Map
      </text>

      <text
        className="metro-name__zh"
        x={width * 0.97}
        y={y}
        fontSize={badgeH * 0.42}
        fill="#555"
        textAnchor="end"
      >
        开往 {info.terminalName.zh} 方向
      </text>
      <text
        className="metro-name__en"
        x={width * 0.97}
        y={y + badgeH * 0.4}
        fontSize={badgeH * 0.24}
        fill="#777"
        textAnchor="end"
      >
        Towards {info.terminalName.en}
      </text>
    </g>
  )
}

interface StationMarkProps {
  station: Station
  x: number
  y: number
  current: boolean
  passed: boolean
  theme: Theme
}

/** 单个站点：白底圆点（当前站为线色实心并加外圈），45° 站名与换乘徽标。 */
const StationMark = (props: StationMarkProps) => {
  const { station, x, y, current, passed, theme } = props
  const isInterchange = station.transfers.length > 0

  return (
    <g transform={`translate(${x},${y})`}>
      {current && <circle r={13} fill="none" stroke={theme[2]} strokeWidth={3} />}
      <circle
        r={current ? 7 : 6}
        fill={current ? theme[2] : '#ffffff'}
        stroke={passed ? PASSED : theme[2]}
        strokeWidth={4}
      />

      <g transform={`translate(${current ? -11 : -9},-14)rotate(-45)`} textAnchor="end">
        <StationName
          name={{ zh: station.name.zh }}
          x={0}
          y={0}
          anchor="end"
          zhSize={FONT_ZH}
          colour={passed ? '#9a9a9a' : '#111'}
        />
      </g>

      {isInterchange && (
        <g transform={`translate(8,-14)rotate(-45)`}>
          <InterchangeBadges
            lines={station.transfers.flatMap((t) => t.lines)}
            x={0}
            y={Math.round(FONT_ZH * 1.25)}
            height={16}
            gap={4}
          />
        </g>
      )}
    </g>
  )
}

/** 依据站点顺序生成折线路径。支线高差较大时插入 90° 转角。 */
const buildPath = (ids: string[], xs: Record<string, number>, ys: Record<string, number>) => {
  const parts: string[] = []
  let prev: { x: number; y: number } | undefined
  for (const id of ids) {
    const x = xs[id]
    const y = ys[id]
    if (x === undefined || y === undefined) continue
    if (!prev) {
      parts.push(`M ${x},${y}`)
    } else if (prev.y !== y) {
      const r = 30
      parts.push(`H ${x - r}`, `Q ${x},${prev.y} ${x},${y}`)
    } else {
      parts.push(`H ${x}`)
    }
    prev = { x, y }
  }
  return parts.join(' ')
}
