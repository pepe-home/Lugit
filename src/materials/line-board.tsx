/**
 * 线路牌：印刷品，单行展示当前线路的全部站点。
 *
 * 已经过的节点置灰，未到的节点用线色，当前站实心高亮。
 * 站点等距排布、字号随站数收缩；站点多时画布按最小站距自动加宽。
 */

import { getMaterialInfo, travelOrder } from '@/core/material'
import type { Network, StationPov, Theme } from '@/core/model'
import { MaterialCanvas } from './canvas'
import { LineBadge } from './line-badge'

export interface LineBoardProps {
  network: Network
  pov: StationPov
  /** 画布宽度下限；站点多时会自动加宽。 */
  width: number
  height: number
  theme: Theme
  language: 'both' | 'zh' | 'en'
}

const MIN_SLOT = 96
const PASSED = '#c0c0c0'

export interface BoardGeometry {
  /** 实际使用的画布宽度。 */
  width: number
  stations: string[]
  xs: number[]
  slot: number
  nameSize: number
}

export const boardGeometry = (
  network: Network,
  pov: StationPov,
  minWidth: number,
  height: number,
  language: 'both' | 'zh' | 'en' = 'zh',
): BoardGeometry => {
  const stations = travelOrder(network, pov)
  const marginX = Math.max(64, height * 0.22)
  const width = Math.max(minWidth, Math.max(1, stations.length - 1) * MIN_SLOT + marginX * 2)
  const slot = (width - marginX * 2) / Math.max(1, stations.length - 1)
  // 按实际显示的语言量字数：英文每字约为汉字的一半宽
  const isEn = language === 'en'
  const maxChars = stations.reduce((max, id) => {
    const name = network.stations[id]?.name
    return Math.max(max, ((isEn ? name?.en : name?.zh) ?? '').length)
  }, 1)
  const nameSize = Math.min(height * 0.105, (slot * 0.92) / (maxChars * (isEn ? 0.58 : 1.02)))
  return {
    width,
    stations,
    xs: stations.map((_, i) => marginX + i * slot),
    slot,
    nameSize,
  }
}

export const LineBoard = (props: LineBoardProps) => {
  const { network, pov, width, height, theme, language } = props
  const info = getMaterialInfo(network, pov)
  const line = info.line
  const geo = boardGeometry(network, pov, width, height, language)
  const passed = new Set(info.passed)
  const currentIndex = geo.stations.indexOf(pov.currentStationId)
  const dotY = height * 0.52
  const nameY = height * 0.68
  const radius = Math.max(5, Math.min(11, geo.slot * 0.1, height * 0.035))
  const lineWidth = Math.max(4, radius * 0.6)

  const startX = geo.xs[0]
  const currentX = geo.xs[currentIndex] ?? startX
  const endX = geo.xs[geo.xs.length - 1]

  return (
    <MaterialCanvas kind="board" width={geo.width} height={height} theme={theme}>
      <Header line={line} width={geo.width} height={height} terminal={info.terminalName.zh ?? ''} />

      {/* 已过区间置灰，未到区间用线色 */}
      {currentIndex > 0 && (
        <line
          x1={startX}
          y1={dotY}
          x2={currentX}
          y2={dotY}
          stroke={PASSED}
          strokeWidth={lineWidth}
        />
      )}
      {currentIndex !== geo.stations.length - 1 && (
        <line
          x1={currentX}
          y1={dotY}
          x2={endX}
          y2={dotY}
          stroke="var(--metro-line-colour)"
          strokeWidth={lineWidth}
        />
      )}

      {geo.stations.map((id, i) => {
        const station = network.stations[id]
        if (!station) return null
        const isCurrent = id === pov.currentStationId
        const isPassed = passed.has(id)
        const label = language === 'en' ? station.name.en : station.name.zh
        return (
          <g key={id} transform={`translate(${geo.xs[i]},${dotY})`}>
            {isCurrent && (
              <circle r={radius * 2} fill="none" stroke={theme[2]} strokeWidth={2} opacity={0.6} />
            )}
            <circle
              r={isCurrent ? radius * 1.2 : radius}
              fill={isCurrent ? theme[2] : '#ffffff'}
              stroke={isPassed ? PASSED : theme[2]}
              strokeWidth={lineWidth}
            />
            <text
              className={cnText(language)}
              x={0}
              y={nameY - dotY}
              fontSize={geo.nameSize}
              textAnchor="middle"
              fill={isCurrent ? '#111' : isPassed ? '#9a9a9a' : '#333333'}
              fontWeight={isCurrent ? 700 : 400}
            >
              {(label ?? '').replaceAll('\\', '')}
            </text>
          </g>
        )
      })}
    </MaterialCanvas>
  )
}

const cnText = (language: 'both' | 'zh' | 'en') =>
  language === 'en' ? 'metro-name__en' : 'metro-name__zh'

interface HeaderProps {
  line: { name: { zh?: string; en?: string }; theme: Theme }
  width: number
  height: number
  terminal: string
}

const Header = (props: HeaderProps) => {
  const { line, width, height, terminal } = props
  const badgeW = Math.max(96, width * 0.06)
  const badgeH = height * 0.15
  const y = height * 0.14

  return (
    <g>
      <LineBadge
        name={line.name}
        theme={line.theme}
        x={width * 0.045}
        y={y - badgeH / 2}
        width={badgeW}
        height={badgeH}
      />
      <text
        className="metro-name__zh"
        x={width * 0.045 + badgeW + 16}
        y={y + badgeH * 0.3}
        fontSize={badgeH * 0.46}
        fill="#555"
      >
        线路牌
      </text>
      <text
        className="metro-name__zh metro-name--bold"
        x={width * 0.955}
        y={y + badgeH * 0.2}
        fontSize={height * 0.07}
        fill="#111"
        textAnchor="end"
      >
        开往 {terminal} 方向
      </text>
    </g>
  )
}
