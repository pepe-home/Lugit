/**
 * 报幕机：单行低分辨率点阵屏，滚动显示一句报站文字。
 *
 * 文案由 `core/announce` 按「当前视角 × 场景 × 模板」生成；
 * 中文优先，语言设为英文时只显示英文。文字超出屏宽时循环滚动，
 * 导出时由 `freeze` 冻结在静态帧。
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

const MARGIN = 24

export const Announce = (props: AnnounceProps) => {
  const { network, pov, width, height, theme, ledColour, scene, templates, language, freeze } =
    props
  const result = composeAnnouncement(network, pov, scene, templates)
  const text = (language === 'en' ? result.texts.en : result.texts.zh) ?? ''

  const screenWidth = width - MARGIN * 2
  const screenHeight = height - MARGIN * 2
  // 单行点阵：让 12 行像素占满屏高，点距越大约分辨率越低
  const pitch = Math.max(2, Math.floor(screenHeight / 12))
  const textHeight = pitch * 12
  const top = (screenHeight - textHeight) / 2

  return (
    <MaterialCanvas kind="announce" width={width} height={height} theme={theme}>
      <LedScreen x={MARGIN} y={MARGIN} width={screenWidth} height={screenHeight} pitch={pitch}>
        <LedText
          text={text}
          pitch={pitch}
          x={pitch}
          y={top}
          colour={LED_COLOURS[ledColour].hex}
          viewportWidth={screenWidth - pitch * 2}
          scroll
          align="center"
          cell={{ width: 2, height: 1 }}
          freeze={freeze}
        />
      </LedScreen>
      <title>{`${result.scene}: ${text}`}</title>
    </MaterialCanvas>
  )
}

export type { AnnounceScene }
