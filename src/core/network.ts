/**
 * 线网编辑后的派生数据重算与站间关系操作。
 *
 * 换乘关系不手工维护，而是由「站点出现在哪些线的站序中」推导；
 * 增删站、调序、改线名线色之后调用 `recomputeTransfers` 一并刷新。
 * 两条线的站点合并为同一座换乘站、或把一座换乘站拆回两条线，也在这里完成。
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

/** 经过某站的线路 id，按 `Network.lines` 顺序。 */
export const linesOfStation = (network: Network, stationId: string): string[] =>
  lineMemberships(network).get(stationId) ?? []

/**
 * 把 `sourceId` 并入 `targetId`：所有经过 source 的线路改为经过 target，
 * source 记录删除，换乘随之重建。两站若在同一条线上则不做处理（避免同线重复站）。
 */
export const mergeStationInto = (network: Network, sourceId: string, targetId: string): Network => {
  if (sourceId === targetId) return network
  const sourceLines = linesOfStation(network, sourceId)
  const targetLines = linesOfStation(network, targetId)
  if (sourceLines.length === 0 || targetLines.length === 0) return network
  if (sourceLines.some((lineId) => targetLines.includes(lineId))) return network

  const replace = (ids: string[]) => ids.map((id) => (id === sourceId ? targetId : id))
  const lines = network.lines.map((line) => ({
    ...line,
    stations: replace(line.stations),
    branches: line.branches?.map(replace),
  }))
  const stations = { ...network.stations }
  delete stations[sourceId]
  return recomputeTransfers({ ...network, lines, stations })
}

/**
 * 解除换乘：把某条线上的 `stationId` 换成一座新的独立站点记录，
 * 其余线路仍共用原记录；新站点沿用原站名与坐标。
 */
export const detachStation = (
  network: Network,
  lineId: string,
  stationId: string,
  newId: string,
): Network => {
  const source = network.stations[stationId]
  const line = network.lines.find((l) => l.id === lineId)
  if (!source || !line) return network
  const onLine =
    line.stations.includes(stationId) ||
    (line.branches ?? []).some((branch) => branch.includes(stationId))
  if (!onLine) return network

  const clone: Station = { ...source, id: newId, transfers: [] }
  const lines = network.lines.map((l) =>
    l.id === lineId
      ? {
          ...l,
          stations: l.stations.map((id) => (id === stationId ? newId : id)),
          branches: l.branches?.map((branch) =>
            branch.map((id) => (id === stationId ? newId : id)),
          ),
        }
      : l,
  )
  return recomputeTransfers({
    ...network,
    lines,
    stations: { ...network.stations, [newId]: clone },
  })
}
