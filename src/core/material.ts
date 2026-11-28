/**
 * 物料数据：站在某一站、朝某一方向时，各物料需要展示什么。
 *
 * 站名牌、线路牌与报幕机的「方向终点站 / 下一站 / 换乘」都由此派生，
 * 保证多份物料对同一情境的描述一致。
 */

import type { InterchangeLine, Line, LocalisedText, Network, Segment, StationPov } from './model'

export interface MaterialInfo {
  line: Line
  currentName: LocalisedText
  nextName: LocalisedText
  terminalName: LocalisedText
  /** 从当前站出发、沿行车方向到终点站的站点序列，含当前站。 */
  route: string[]
  /** 已经过的站点，从最近的一站往前排。 */
  passed: string[]
  /** 下一站；已到终点站时为空。 */
  nextIds: string[]
  terminalId: string
  isNextTerminal: boolean
  atTerminal: boolean
  /** 离站播报用的换乘（下一站的换乘）。 */
  nextInterchanges: InterchangeLine[]
  /** 到站播报用的换乘（当前站的换乘）。 */
  currentInterchanges: InterchangeLine[]
}

const travelSegmentsOf = (
  network: Network,
  lineId: string,
  direction: StationPov['direction'],
): Segment[] => {
  const line = network.lines.find((l) => l.id === lineId)
  if (!line) return []
  const segs: Segment[] = []
  for (let i = 0; i < line.stations.length - 1; i++) {
    segs.push({ from: line.stations[i], to: line.stations[i + 1] })
  }
  for (const branch of line.branches ?? []) {
    // 支线首站是挂靠点，本身属于主干；其余依次相连
    for (let i = 1; i < branch.length - 1; i++) {
      segs.push({ from: branch[i], to: branch[i + 1] })
    }
  }
  return direction === 'l' ? segs.map((seg) => ({ from: seg.to, to: seg.from })) : segs
}

const indexSegments = (segments: Segment[]) => {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const seg of segments) {
    outgoing.set(seg.from, [...(outgoing.get(seg.from) ?? []), seg.to])
    incoming.set(seg.to, [...(incoming.get(seg.to) ?? []), seg.from])
  }
  return { outgoing, incoming }
}

/** 沿行车方向从当前站走到终点站（或交路终点）的站点序列。 */
export const walkRoute = (network: Network, pov: StationPov): string[] => {
  const { outgoing } = indexSegments(travelSegmentsOf(network, pov.lineId, pov.direction))
  const route = [pov.currentStationId]
  const visited = new Set(route)
  let cursor = pov.currentStationId
  for (;;) {
    if (pov.trainTerminalId && cursor === pov.trainTerminalId) break
    const next = (outgoing.get(cursor) ?? []).find((id) => !visited.has(id))
    if (!next) break
    route.push(next)
    visited.add(next)
    cursor = next
  }
  return route
}

/** 行车方向的反向可达站点，即已经过的站点。 */
export const walkBackward = (network: Network, pov: StationPov): string[] => {
  const { incoming } = indexSegments(travelSegmentsOf(network, pov.lineId, pov.direction))
  const passed: string[] = []
  const visited = new Set([pov.currentStationId])
  let cursor = pov.currentStationId
  for (;;) {
    const prev = (incoming.get(cursor) ?? []).find((id) => !visited.has(id))
    if (!prev) break
    passed.push(prev)
    visited.add(prev)
    cursor = prev
  }
  return passed
}

/** 当前线路的全部主干站点，按行车方向排列（线路牌的单行顺序）。 */
export const travelOrder = (network: Network, pov: StationPov): string[] => {
  const line = network.lines.find((l) => l.id === pov.lineId)
  if (!line) return []
  return pov.direction === 'l' ? [...line.stations].reverse() : [...line.stations]
}

export const getMaterialInfo = (network: Network, pov: StationPov): MaterialInfo => {
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const route = walkRoute(network, pov)
  const passed = walkBackward(network, pov)
  const nextIds = route.slice(1, 2)
  const terminalId = route[route.length - 1]
  const interchangesOf = (id: string) =>
    network.stations[id]?.transfers.flatMap((t) => t.lines) ?? []

  const nameOf = (id: string): LocalisedText => {
    const name = network.stations[id]?.name ?? {}
    return { zh: (name.zh ?? '').replaceAll('\\', ''), en: (name.en ?? '').replaceAll('\\', ' ') }
  }
  const joinNames = (ids: string[], lang: 'zh' | 'en') =>
    ids
      .map((id) => nameOf(id)[lang])
      .filter(Boolean)
      .join(lang === 'zh' ? '、' : ' / ')

  return {
    line,
    currentName: nameOf(pov.currentStationId),
    nextName: { zh: joinNames(nextIds, 'zh'), en: joinNames(nextIds, 'en') },
    terminalName: nameOf(terminalId),
    route,
    passed,
    nextIds,
    terminalId,
    isNextTerminal: nextIds.length > 0 && nextIds[0] === terminalId,
    atTerminal: nextIds.length === 0,
    nextInterchanges: nextIds.flatMap(interchangesOf),
    currentInterchanges: interchangesOf(pov.currentStationId),
  }
}
