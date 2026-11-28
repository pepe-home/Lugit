import type { AnnounceTemplates, SceneMode } from '@/core/announce'
import type { CanvasKind, Network, StationPov, Theme } from '@/core/model'
import { Announce } from './announce'
import { LineBoard } from './line-board'
import { StationPlate } from './station-plate'
import { LED_COLOURS } from './led/led'

export interface MaterialSettings {
  ledColour: keyof typeof LED_COLOURS
  scene: SceneMode
  templates: AnnounceTemplates
  language: 'both' | 'zh' | 'en'
}

export interface MaterialProps {
  kind: CanvasKind
  network: Network
  pov: StationPov
  width: number
  height: number
  theme: Theme
  settings: MaterialSettings
  /** 导出时为真：动画元素渲染静态帧。 */
  freeze?: boolean
}

/**
 * 按物料类型渲染对应组件。三种物料共享同一份线网与当前视角。
 */
export const Material = (props: MaterialProps) => {
  const { kind, network, pov, width, height, theme, settings, freeze } = props
  switch (kind) {
    case 'plate':
      return (
        <StationPlate
          network={network}
          pov={pov}
          width={width}
          height={height}
          theme={theme}
          language={settings.language}
        />
      )
    case 'board':
      return (
        <LineBoard
          network={network}
          pov={pov}
          width={width}
          height={height}
          theme={theme}
          language={settings.language}
        />
      )
    case 'announce':
      return (
        <Announce
          network={network}
          pov={pov}
          width={width}
          height={height}
          theme={theme}
          ledColour={settings.ledColour}
          scene={settings.scene}
          templates={settings.templates}
          language={settings.language}
          freeze={freeze}
        />
      )
  }
}

export const CANVAS_KINDS: CanvasKind[] = ['plate', 'board', 'announce']

export const CANVAS_LABELS: Record<CanvasKind, { zh: string; en: string }> = {
  plate: { zh: '站名牌', en: 'Station plate' },
  board: { zh: '线路牌', en: 'Line board' },
  announce: { zh: '报幕机', en: 'Announcement' },
}

export { boardGeometry } from './line-board'
