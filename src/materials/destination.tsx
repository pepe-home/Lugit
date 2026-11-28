/**
 * 终点站站牌。
 *
 * 两种样式：
 * - `led`：车外 LED 点阵屏，显示「线路 · 终点站」，过长时滚动；
 * - `print`：灯箱/贴纸版，左侧线路色块，右侧「终点站 / TERMINAL」与大号站名。
 */

import { getMaterialInfo } from '@/core/material'
import type { Network, StationPov, Theme } from '@/core/model'
import { LedScreen, LedText, LED_COLOURS } from './led/led'
import { MaterialCanvas } from './canvas'

export type DestinationStyle = 'led' | 'print'

export interface DestinationProps {
  network: Network
  pov: StationPov
  width: number
  height: number
  style: DestinationStyle
  ledColour: keyof typeof LED_COLOURS
  theme: Theme
  freeze?: boolean
}

export const Destination = (props: DestinationProps) => {
  const { network, pov, width, height, style, ledColour, theme, freeze } = props
  const info = getMaterialInfo(network, pov)
  const line = info.line

  return (
    <MaterialCanvas kind="destination" width={width} height={height} theme={theme}>
      {style === 'led' ? (
        <DestinationLed
          width={width}
          height={height}
          colour={LED_COLOURS[ledColour].hex}
          zh={`${line.name.zh} 终点站 ${info.terminalName.zh}`}
          en={`${line.name.en} To ${info.terminalName.en}`}
          scroll
          freeze={freeze}
        />
      ) : (
        <DestinationPrint
          width={width}
          height={height}
          lineZh={line.name.zh ?? ''}
          lineEn={line.name.en ?? ''}
          terminalZh={info.terminalName.zh ?? ''}
          terminalEn={info.terminalName.en ?? ''}
        />
      )}
    </MaterialCanvas>
  )
}

interface DestinationLedProps {
  width: number
  height: number
  colour: string
  zh: string
  en: string
  scroll?: boolean
  freeze?: boolean
}

const MARGIN = 32

const DestinationLed = (props: DestinationLedProps) => {
  const { width, height, colour, zh, en, scroll, freeze } = props
  const screenWidth = width - MARGIN * 2
  const screenHeight = height - MARGIN * 2
  const gap = 12
  // 中英文各占一行，中文双宽字形
  const pitchByHeight = Math.floor((screenHeight - gap) / 24) - 1
  const pitchByWidth = Math.floor((screenWidth - 4) / (12 * 3))
  const pitch = Math.max(2, Math.min(pitchByHeight, pitchByWidth))
  const rowHeight = pitch * 12
  const top = (screenHeight - (rowHeight * 2 + gap)) / 2

  return (
    <LedScreen x={MARGIN} y={MARGIN} width={screenWidth} height={screenHeight} pitch={pitch}>
      <LedText
        text={zh}
        pitch={pitch}
        x={pitch}
        y={top + pitch}
        colour={colour}
        viewportWidth={screenWidth - pitch * 2}
        scroll={scroll}
        align="center"
        cell={{ width: 2, height: 1 }}
        freeze={freeze}
      />
      <LedText
        text={en}
        pitch={pitch}
        x={pitch}
        y={top + rowHeight + gap + pitch}
        colour={colour}
        viewportWidth={screenWidth - pitch * 2}
        scroll={scroll}
        align="center"
        cell={{ width: 2, height: 1 }}
        freeze={freeze}
      />
    </LedScreen>
  )
}

interface DestinationPrintProps {
  width: number
  height: number
  lineZh: string
  lineEn: string
  terminalZh: string
  terminalEn: string
}

const DestinationPrint = (props: DestinationPrintProps) => {
  const { width, height, lineZh, lineEn, terminalZh, terminalEn } = props
  const badgeWidth = Math.min(220, width * 0.2)
  const badgeHeight = Math.min(150, height * 0.55)
  const badgeX = width * 0.06
  const badgeY = (height - badgeHeight) / 2
  const textX = badgeX + badgeWidth + 56
  const textWidth = width - textX - width * 0.05
  const zhSize = Math.min(120, height * 0.36, textWidth / Math.max(1, terminalZh.length) / 1.05)

  return (
    <g>
      <rect
        x={0}
        y={0}
        width={Math.max(12, width * 0.012)}
        height={height}
        fill="var(--metro-line-colour)"
      />

      <g>
        <rect
          x={badgeX}
          y={badgeY}
          width={badgeWidth}
          height={badgeHeight}
          rx={badgeHeight * 0.12}
          fill="var(--metro-line-colour)"
        />
        <text
          className="metro-name__zh metro-name--bold"
          x={badgeX + badgeWidth / 2}
          y={badgeY + badgeHeight * 0.46}
          fontSize={badgeHeight * 0.36}
          fill="var(--metro-line-fg)"
          textAnchor="middle"
        >
          {lineZh}
        </text>
        <text
          className="metro-name__en"
          x={badgeX + badgeWidth / 2}
          y={badgeY + badgeHeight * 0.78}
          fontSize={badgeHeight * 0.16}
          fill="var(--metro-line-fg)"
          textAnchor="middle"
        >
          {lineEn}
        </text>
      </g>

      <g>
        <text
          className="metro-name__zh"
          x={textX}
          y={height * 0.32}
          fontSize={height * 0.1}
          fill="#555"
        >
          终点站
        </text>
        <text
          className="metro-name__en"
          x={textX + height * 0.24}
          y={height * 0.32}
          fontSize={height * 0.06}
          fill="#555"
        >
          TERMINAL
        </text>
        <text
          className="metro-name__zh metro-name--bold"
          x={textX}
          y={height * 0.72}
          fontSize={zhSize}
          fill="#111"
          textLength={Math.min(
            textWidth,
            Math.max(textWidth * 0.6, terminalZh.length * zhSize * 0.95),
          )}
          lengthAdjust="spacingAndGlyphs"
        >
          {terminalZh}
        </text>
        <text
          className="metro-name__en"
          x={textX}
          y={height * 0.88}
          fontSize={Math.min(42, height * 0.11)}
          fill="#333"
          textLength={Math.min(textWidth * 0.9, Math.max(terminalEn.length * height * 0.045, 0))}
          lengthAdjust="spacingAndGlyphs"
        >
          {terminalEn}
        </text>
      </g>
    </g>
  )
}
