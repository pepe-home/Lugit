/**
 * 当前站名牌：车门上方的横向屏。左线路徽标，中间大号当前站名，右侧下一站与终点站提示。
 */

import { getMaterialInfo } from '@/core/material'
import type { Network, StationPov, Theme } from '@/core/model'
import { MaterialCanvas } from './canvas'
import { InterchangeBadges } from './line-badge'
import { StationName } from './station-name'

export interface RunInProps {
  network: Network
  pov: StationPov
  width: number
  height: number
  theme: Theme
  /** 是否显示车站编号；合肥轨道没有官方编号，默认关闭。 */
  showCode?: boolean
}

export const RunIn = (props: RunInProps) => {
  const { network, pov, width, height, theme, showCode = false } = props
  const info = getMaterialInfo(network, pov)
  const current = network.stations[pov.currentStationId]
  const line = info.line

  const margin = Math.round(height * 0.07)
  const screen = { x: margin, y: margin, width: width - margin * 2, height: height - margin * 2 }
  const badgeWidth = Math.round(screen.width * 0.13)
  const badgeHeight = Math.round(screen.height * 0.52)

  const centreX = screen.x + screen.width * 0.44
  const zhSize = Math.min(96, screen.height * 0.42)
  const listX = screen.x + screen.width - screen.width * 0.03

  return (
    <MaterialCanvas kind="runin" width={width} height={height} theme={theme}>
      <rect
        x={screen.x}
        y={screen.y}
        width={screen.width}
        height={screen.height}
        rx={Math.round(height * 0.05)}
        fill="#101010"
      />

      {/* 线路徽标 */}
      <g
        transform={`translate(${screen.x + screen.width * 0.025},${screen.y + (screen.height - badgeHeight) / 2})`}
      >
        <rect
          width={badgeWidth}
          height={badgeHeight}
          rx={badgeHeight * 0.14}
          fill="var(--metro-line-colour)"
        />
        <text
          className="metro-name__zh metro-name--bold"
          x={badgeWidth / 2}
          y={badgeHeight * 0.45}
          fontSize={badgeHeight * 0.36}
          fill="var(--metro-line-fg)"
          textAnchor="middle"
        >
          {line.name.zh}
        </text>
        <text
          className="metro-name__en"
          x={badgeWidth / 2}
          y={badgeHeight * 0.8}
          fontSize={badgeHeight * 0.16}
          fill="var(--metro-line-fg)"
          textAnchor="middle"
        >
          {line.name.en}
        </text>
      </g>

      {/* 当前站 */}
      <g textAnchor="middle">
        <text
          className="metro-name__en"
          x={centreX}
          y={screen.y + screen.height * 0.3}
          fontSize={screen.height * 0.1}
          fill="#8a8a8a"
          letterSpacing="0.15em"
        >
          NOW
        </text>
        <StationName
          key={pov.currentStationId}
          name={current.name}
          x={centreX}
          y={screen.y + screen.height * 0.62}
          zhSize={zhSize}
          enSize={Math.round(zhSize * 0.36)}
          maxWidth={screen.width * 0.42}
          colour="#ffffff"
        />
        {showCode && current.code && (
          <text
            className="metro-name__en"
            x={centreX}
            y={screen.y + screen.height * 0.86}
            fontSize={screen.height * 0.09}
            fill="#d0d0d0"
          >
            {current.code}
          </text>
        )}
      </g>

      <NextPanel
        x={listX}
        y={screen.y + screen.height * 0.3}
        width={screen.width * 0.34}
        info={info}
        direction={pov.direction}
        arrowColour={theme[2]}
      />

      {info.currentInterchanges.length > 0 && (
        <g
          transform={`translate(${screen.x + screen.width * 0.28},${screen.y + screen.height * 0.78})`}
        >
          <text className="metro-name__zh" fontSize={screen.height * 0.09} fill="#9a9a9a">
            可换乘
          </text>
          <InterchangeBadges
            lines={info.currentInterchanges}
            x={screen.height * 0.42}
            y={-screen.height * 0.055}
            height={Math.round(screen.height * 0.11)}
            gap={6}
          />
        </g>
      )}
    </MaterialCanvas>
  )
}

interface NextPanelProps {
  x: number
  y: number
  width: number
  info: ReturnType<typeof getMaterialInfo>
  direction: StationPov['direction']
  arrowColour: string
}

/**
 * 右侧「下一站」「终点站」两行，箭头指向行车方向。
 */
const NextPanel = (props: NextPanelProps) => {
  const { x, y, width, info, direction, arrowColour } = props
  const arrow = direction === 'r' ? '→' : '←'

  return (
    <g>
      <text className="metro-name__zh" x={x} y={y} fontSize={width * 0.1} fill="#c8a25a">
        下一站
      </text>
      <text
        className="metro-name__en"
        x={x + width * 0.34}
        y={y}
        fontSize={width * 0.06}
        fill="#c8a25a"
      >
        {info.atTerminal ? 'Ter.' : 'Next'}
      </text>
      <text
        className="metro-name__zh"
        x={x}
        y={y + width * 0.14}
        fontSize={width * 0.12}
        fill="#ffffff"
      >
        {info.atTerminal ? '终点站' : (info.nextName.zh ?? '')}
      </text>
      <text
        className="metro-name__zh metro-name--bold"
        x={x + width * 0.62}
        y={y + width * 0.14}
        fontSize={width * 0.14}
        fill={arrowColour}
      >
        {info.atTerminal ? '' : arrow}
      </text>

      <text
        className="metro-name__zh"
        x={x}
        y={y + width * 0.34}
        fontSize={width * 0.1}
        fill="#8a8a8a"
      >
        终点站
      </text>
      <text
        className="metro-name__en"
        x={x + width * 0.34}
        y={y + width * 0.34}
        fontSize={width * 0.06}
        fill="#8a8a8a"
      >
        To
      </text>
      <text
        className="metro-name__zh"
        x={x}
        y={y + width * 0.47}
        fontSize={width * 0.12}
        fill="#d0d0d0"
      >
        {info.terminalName.zh}
      </text>
    </g>
  )
}
