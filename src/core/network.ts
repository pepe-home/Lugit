/**
 * 线网编辑后的派生数据重算。
 *
 * 换乘关系不手工维护，而是由「站点出现在哪些线的站序中」推导；
 * 增删站、调序、改线名线色之后调用 `recomputeTransfers` 一并刷新。
 */

import type { InterchangeLine, Network, Station } from './model'

/** 每条线实际引用到的站点 id（主干与支线，去重）。 */
export const stationsOfLine = (network: Network, lineId: string): string[] => {
  const line = network.lines.find((l) => l.id === lineId)
  if (!line) return []
  return [...new Set([...line.stations, ...(line.branches ?? []).flat()])]
}

/** 站点 id → 经过它的线路 id，按 `Network.lines` 的顺序。 */
export const lineMemberships = (network: Network): Map<string, string[]> => {
  const memberships = new Map<string, string[]>()
  for (const line of network.lines) {
    const ids = new Set([...line.stations, ...(line.branches ?? []).flat()])
    for (const id of ids) {
      memberships.set(id, [...(memberships.get(id) ?? []), line.id])
    }
  }
  return memberships
}

/**
 * 重建全部换乘：一座站被两条及以上线路经过即为站内换乘，
 * 徽标列出除第一条之外的全部线路（与种子数据的口径一致）。
 */
export const recomputeTransfers = (network: Network): Network => {
  const memberships = lineMemberships(network)
  const stations: Record<string, Station> = {}
  for (const [id, station] of Object.entries(network.stations)) {
    const lineIds = memberships.get(id) ?? []
    const lines: InterchangeLine[] = lineIds.slice(1).flatMap((lineId) => {
      const line = network.lines.find((l) => l.id === lineId)
      return line ? [{ theme: line.theme, name: line.name }] : []
    })
    stations[id] = {
      ...station,
      transfers: lines.length ? [{ kind: 'in-station', paidArea: true, lines }] : [],
    }
  }
  return { ...network, stations }
}
