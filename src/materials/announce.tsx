/**
 * 放送机：车载 LED 点阵屏的报站画面。
 *
 * 显示内容由 `core/announce` 按「当前视角 × 场景 × 模板」生成，中英文各一行，
 * 需先装下时整体居中，放不下时滚动。
 */

import {
  composeAnnouncement,
  type AnnounceScene,
  type AnnounceTemplates,
  type SceneMode,
} from '@/core/announce'
import type { Network, StationPov, Theme } from '@/core/model'
import { MaterialCanvas } from './canvas'
import { LedScreen, LedText, LED_COLOURS } from './led/led'

export interface AnnounceProps {
  network: Network
  pov: StationPov
  width: number
  height: number
  theme: Theme
  ledColour: keyof typeof LED_COLOURS
  scene: SceneMode
  templates: AnnounceTemplates
  language: 'both' | 'zh' | 'en'
  freeze?: boolean
}

export const Announce = (props: AnnounceProps) => {
  const { network, pov, width, height, theme, ledColour, scene, templates, language, freeze } =
    props
  const result = composeAnnouncement(network, pov, scene, templates)
  const rows =
    language === 'both'
      ? [result.texts.zh, result.texts.en]
      : language === 'zh'
        ? [result.texts.zh]
        : [result.texts.en]

  return (
    <MaterialCanvas kind="announce" width={width} height={height} theme={theme}>
      <AnnounceScreen
        width={width}
        height={height}
        colour={LED_COLOURS[ledColour].hex}
        rows={rows.filter((r): r is string => !!r)}
        scroll
        freeze={freeze}
      />
      <title>{`${result.scene}: ${result.texts.zh ?? ''}`}</title>
    </MaterialCanvas>
  )
}

interface AnnounceScreenProps {
  width: number
  height: number
  colour: string
  rows: string[]
  scroll?: boolean
  freeze?: boolean
}

const MARGIN = 28
// 左右各留 1 列点阵的边距
const pitchPad = 4

const AnnounceScreen = (props: AnnounceScreenProps) => {
  const { width, height, colour, rows, scroll, freeze } = props
  const screenWidth = width - MARGIN * 2
  const screenHeight = height - MARGIN * 2
  const rowCount = Math.max(1, rows.length)
  const gap = Math.max(6, Math.round(screenHeight * 0.06))
  // 中英文各占一行；中文是双宽字形，一行最多 screenWidth / 24 个汉字
  const pitchByHeight = Math.floor((screenHeight - gap * (rowCount - 1)) / (rowCount * 12)) - 1
  // 按最长的一行反推：中文每字占 24 列（12 列 × 双宽），英文每字约 6 列
  const longestCols = rows.length
    ? rows.reduce((max, row) => {
        const cjk = (row.match(/[　-鿿＀-￯]/g) ?? []).length
        const latin = row.length - cjk
        return Math.max(max, cjk * 24 + latin * 6)
      }, 0)
    : 24
  const pitchByWidth = Math.floor((screenWidth - pitchPad) / (longestCols * 2.2))
  const pitch = Math.max(2, Math.min(pitchByHeight, pitchByWidth))
  const rowHeight = pitch * 12
  const totalHeight = rowHeight * rowCount + gap * (rowCount - 1)
  const top = (screenHeight - totalHeight) / 2

  return (
    <LedScreen x={MARGIN} y={MARGIN} width={screenWidth} height={screenHeight} pitch={pitch}>
      {rows.map((text, i) => (
        <LedText
          key={i}
          text={text}
          pitch={pitch}
          x={pitch}
          y={top + i * (rowHeight + gap) + pitch}
          colour={colour}
          viewportWidth={screenWidth - pitch * 2}
          scroll={scroll}
          align="center"
          cell={{ width: 2, height: 1 }}
          freeze={freeze}
        />
      ))}
    </LedScreen>
  )
}

export type { AnnounceScene }
