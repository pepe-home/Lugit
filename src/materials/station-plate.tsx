/**
 * 站名牌：印刷品。
 *
 * 版面只有三样信息：当前线路名称、站名、该方向终点站。
 * 左侧线路色块，中间大号站名，右侧行车方向，底部一条线色带。
 */

import { getMaterialInfo } from '@/core/material'
import type { Network, StationPov, Theme } from '@/core/model'
import { MaterialCanvas } from './canvas'

export interface StationPlateProps {
  network: Network
  pov: StationPov
  width: number
  height: number
  theme: Theme
  language: 'both' | 'zh' | 'en'
}

export const StationPlate = (props: StationPlateProps) => {
  const { network, pov, width, height, theme, language } = props
  const info = getMaterialInfo(network, pov)
  const line = info.line
  const station = network.stations[pov.currentStationId]

  const marginX = width * 0.055
  const bandHeight = height * 0.06
  const badge = {
    x: marginX,
    y: height * 0.16,
    width: width * 0.145,
    height: height * 0.44,
  }
  const textX = badge.x + badge.width + width * 0.035
  const directionX = width - marginX
  const nameMaxWidth = width * 0.46
  const arrowX = width * 0.735
  const centreY = height * 0.47

  const isEn = language === 'en'
  const main = (isEn ? station?.name.en : station?.name.zh) ?? ''
  const sub = language === 'both' ? (station?.name.en ?? '') : ''
  const mainSize = isEn
    ? Math.min(height * 0.22, nameMaxWidth / Math.max(1, main.length) / 0.56)
    : Math.min(height * 0.34, nameMaxWidth / Math.max(1, main.length * 1.04))

  return (
    <MaterialCanvas kind="plate" width={width} height={height} theme={theme}>
      {/* 底部线色带 */}
      <rect x={0} y={height - bandHeight} width={width} height={bandHeight} fill={theme[2]} />

      {/* 线路色块 */}
      <g>
        <rect
          x={badge.x}
          y={badge.y}
          width={badge.width}
          height={badge.height}
          rx={badge.height * 0.1}
          fill={theme[2]}
        />
        <text
          className="metro-name__zh metro-name--bold"
          x={badge.x + badge.width / 2}
          y={badge.y + badge.height * 0.44}
          fontSize={badge.height * 0.3}
          fill={theme[3]}
          textAnchor="middle"
        >
          {line.name.zh}
        </text>
        <text
          className="metro-name__en"
          x={badge.x + badge.width / 2}
          y={badge.y + badge.height * 0.74}
          fontSize={badge.height * 0.14}
          fill={theme[3]}
          textAnchor="middle"
        >
          {line.name.en}
        </text>
      </g>

      {/* 站名 */}
      <text
        className="metro-name__zh metro-name--bold"
        x={textX}
        y={centreY}
        fontSize={mainSize}
        fill="#111"
        style={{ letterSpacing: isEn ? '0.02em' : '0.06em' }}
      >
        {main}
      </text>
      {sub && (
        <text
          className="metro-name__en"
          x={textX}
          y={centreY + height * 0.17}
          fontSize={Math.min(height * 0.095, nameMaxWidth / Math.max(1, sub.length) / 0.5)}
          fill="#666"
        >
          {sub}
        </text>
      )}

      {/* 行车方向 */}
      <g transform={`translate(${arrowX},${centreY - height * 0.02})`}>
        <path
          d={
            pov.direction === 'r'
              ? `M 0 ${-height * 0.06} L ${height * 0.05} 0 L 0 ${height * 0.06}`
              : `M ${height * 0.05} ${-height * 0.06} L 0 0 L ${height * 0.05} ${height * 0.06}`
          }
          fill="none"
          stroke={theme[2]}
          strokeWidth={height * 0.018}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g textAnchor="end">
        <text
          className="metro-name__zh"
          x={directionX}
          y={height * 0.33}
          fontSize={height * 0.072}
          fill="#777"
        >
          开往
        </text>
        <text
          className="metro-name__zh metro-name--bold"
          x={directionX}
          y={height * 0.52}
          fontSize={Math.min(
            height * 0.18,
            (width * 0.16) / Math.max(1, (info.terminalName.zh ?? '').length),
          )}
          fill={theme[2]}
        >
          {info.terminalName.zh}
        </text>
        <text
          className="metro-name__en"
          x={directionX}
          y={height * 0.64}
          fontSize={height * 0.062}
          fill="#777"
        >
          Towards {info.terminalName.en}
        </text>
      </g>
    </MaterialCanvas>
  )
}
