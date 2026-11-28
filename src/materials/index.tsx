import type { AnnounceTemplates, SceneMode } from '@/core/announce'
import type { CanvasKind, Network, StationPov, Theme } from '@/core/model'
import { Announce } from './announce'
import { Destination, type DestinationStyle } from './destination'
import { RailMap } from './railmap'
import { RunIn } from './runin'
import { LED_COLOURS } from './led/led'

export interface MaterialSettings {
  style: DestinationStyle
  ledColour: keyof typeof LED_COLOURS
  scene: SceneMode
  templates: AnnounceTemplates
  language: 'both' | 'zh' | 'en'
  showCode: boolean
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
 * 按物料类型渲染对应组件。所有物料共享同一份线网与当前视角。
 */
export const Material = (props: MaterialProps) => {
  const { kind, network, pov, width, height, theme, settings, freeze } = props
  switch (kind) {
    case 'destination':
      return (
        <Destination
          network={network}
          pov={pov}
          width={width}
          height={height}
          style={settings.style}
          ledColour={settings.ledColour}
          theme={theme}
          freeze={freeze}
        />
      )
    case 'runin':
      return (
        <RunIn
          network={network}
          pov={pov}
          width={width}
          height={height}
          theme={theme}
          showCode={settings.showCode}
        />
      )
    case 'railmap':
      return <RailMap network={network} pov={pov} width={width} height={height} theme={theme} />
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

export const CANVAS_KINDS: CanvasKind[] = ['destination', 'runin', 'railmap', 'announce']

export const CANVAS_LABELS: Record<CanvasKind, { zh: string; en: string }> = {
  destination: { zh: '终点站站牌', en: 'Destination' },
  runin: { zh: '当前站名牌', en: 'Current station' },
  railmap: { zh: '路线图', en: 'Route map' },
  announce: { zh: '放送机', en: 'Announcement' },
}
