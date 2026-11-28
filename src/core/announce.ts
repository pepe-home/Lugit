/**
 * 放送机文案：离站 / 到站 × 是否终点站，中英文各一句。
 *
 * 模板里可用的占位符：{station} {next} {terminal} {line} {doors} {interchange}。
 * 文案模型参考 rmg 家族 RMA（Rail Map Announcer，GPL-3.0）的「站点 × 场景 × 语言」变体表，
 * 但把「预定义短语 + 拼音」收敛成直接可渲染的模板字符串。
 * @see https://github.com/railmapgen/rma
 */

import type { LocalisedText, Network, StationPov } from './model'
import { getMaterialInfo, type MaterialInfo } from './material'

export type AnnounceScene = 'departure' | 'departureTerminal' | 'arrival' | 'arrivalTerminal'
export type SceneMode = 'auto' | AnnounceScene

export const ANNOUNCE_SCENES: AnnounceScene[] = [
  'departure',
  'departureTerminal',
  'arrival',
  'arrivalTerminal',
]

export interface AnnounceTemplates {
  departure: LocalisedText
  departureTerminal: LocalisedText
  arrival: LocalisedText
  arrivalTerminal: LocalisedText
}

export const DEFAULT_TEMPLATES: AnnounceTemplates = {
  departure: {
    zh: '下一站：{next}。{interchange}开{doors}门。',
    en: 'Next station: {next}. {interchange}Doors will open on the {doors}.',
  },
  departureTerminal: {
    zh: '下一站：{next}，本次列车终点站。开{doors}门。',
    en: 'Next station: {next}, the terminal station of this train. Doors will open on the {doors}.',
  },
  arrival: {
    zh: '{station}站到了。请从{doors}门下车，下车时请注意列车与站台之间的空隙。',
    en: 'We are now at {station}. Please exit from the {doors} doors, and mind the gap between the train and the platform.',
  },
  arrivalTerminal: {
    zh: '{station}站到了，本次列车终点站。请全体乘客带好随身物品，从{doors}门下车。',
    en: 'We are now at {station}, the terminal station of this train. Please take all your belongings and exit from the {doors} doors.',
  },
}

export const resolveScene = (
  mode: SceneMode,
  info: Pick<MaterialInfo, 'atTerminal' | 'isNextTerminal'>,
): AnnounceScene => {
  if (mode !== 'auto') return mode
  if (info.atTerminal) return 'arrivalTerminal'
  return info.isNextTerminal ? 'departureTerminal' : 'departure'
}

const doors = (side: StationPov['doorSide']): LocalisedText =>
  side === 'left' ? { zh: '左', en: 'left' } : { zh: '右', en: 'right' }

const interchanges = (lines: { name: LocalisedText }[]): LocalisedText => {
  const zh = lines.map((l) => l.name.zh).filter(Boolean)
  const en = lines.map((l) => l.name.en).filter(Boolean)
  return {
    zh: zh.length ? `乘客可换乘${zh.join('、')}。` : '',
    en: en.length ? `Interchange for ${en.join(' and ')}. ` : '',
  }
}

export type AnnouncePlaceholder = 'station' | 'next' | 'terminal' | 'line' | 'doors' | 'interchange'

export const PLACEHOLDERS: AnnouncePlaceholder[] = [
  'station',
  'next',
  'terminal',
  'line',
  'doors',
  'interchange',
]

export interface AnnounceResult {
  scene: AnnounceScene
  values: Record<AnnouncePlaceholder, LocalisedText>
  texts: LocalisedText
}

/**
 * 由当前视角与模板得到这一站的播报文案。
 */
export const composeAnnouncement = (
  network: Network,
  pov: StationPov,
  mode: SceneMode,
  templates: AnnounceTemplates,
): AnnounceResult => {
  const info = getMaterialInfo(network, pov)
  const scene = resolveScene(mode, info)
  // 离站播报里的换乘信息针对的是下一站
  const fromNext = scene.startsWith('departure')

  const values: Record<AnnouncePlaceholder, LocalisedText> = {
    station: info.currentName,
    next: info.nextName,
    terminal: info.terminalName,
    line: info.line.name,
    doors: doors(pov.doorSide),
    interchange: interchanges(fromNext ? info.nextInterchanges : info.currentInterchanges),
  }

  const fill = (template = '', lang: 'zh' | 'en') =>
    template.replace(
      /\{(\w+)\}/g,
      (match, key: string) => values[key as AnnouncePlaceholder]?.[lang] ?? match,
    )

  const template = templates[scene]
  return {
    scene,
    values,
    texts: { zh: fill(template.zh, 'zh'), en: fill(template.en, 'en') },
  }
}

/**
 * 导出用：把一段播报流程里的场景串起来。`route` 按行车方向排列。
 */
export const composeJourney = (
  network: Network,
  pov: StationPov,
  mode: SceneMode,
  templates: AnnounceTemplates,
): ReturnType<typeof composeAnnouncement>[] => {
  const info = getMaterialInfo(network, pov)
  return info.route.flatMap((stationId, index) => {
    const next = info.route[index + 1]
    const result = composeAnnouncement(
      network,
      { ...pov, currentStationId: stationId },
      mode,
      templates,
    )
    // 只有下一站仍可播报离站；终点站默认只播到站
    return result.scene.startsWith('departure') && !next ? [] : [result]
  })
}
