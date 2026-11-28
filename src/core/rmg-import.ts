/**
 * 从 rmg 站表迁移为 metro 线网。
 *
 * rmg 的站表是「parents / children 邻接表 + linestart / lineend 虚拟站」，
 * 并按风格附带大量无关字段。这里只取 `localisedName`（旧格式为 `name`）、
 * `num`、`transfer.groups` 与 `services`，其余丢弃，线序按邻接表还原。
 *
 * 迁移规则对齐 rmg `updateParam`（GPL-3.0）中与站点结构有关的最小集。
 * @see https://github.com/railmapgen/rmg/blob/main/src/util/param-updater-utils.ts
 */

import { getPaletteEntry, HEFEI_CITY_ID, type Theme } from '@/data/palette'
import type {
  InterchangeLine,
  Line,
  LocalisedText,
  Network,
  ServiceKind,
  Station,
  Transfer,
} from './model'

type RawInterchange = { theme?: [string, string, string, string]; name?: [string, string] }

export type RawRmgStation = {
  name?: [string, string]
  localisedName?: LocalisedText
  secondaryName?: [string, string]
  localisedSecondaryName?: LocalisedText
  num?: string
  parents?: string[]
  children?: string[]
  services?: string[]
  transfer?: {
    groups?: { lines?: RawInterchange[] }[]
    /** rmg ≤ 5.10 的旧字段：[同站换乘, 出站换乘, 系统外换乘]，每项是 [...Theme, ...Name] 数组。 */
    info?: [string, string, string, string, string, string][][]
  }
  facility?: string
  underConstruction?: unknown
}

export type RawRmgParam = {
  theme: [string, string, string, string]
  line_name: [string, string]
  loop?: boolean
  stn_list: Record<string, RawRmgStation>
}

/** rmg 用这两个虚拟站表示线路两端，导入时丢弃。 */
const PSEUDO = new Set(['linestart', 'lineend'])
const SERVICES: ServiceKind[] = ['local', 'express', 'direct']
const KIND_BY_INDEX = ['in-station', 'out-of-station', 'out-of-system'] as const

export const toLocalised = (stn: RawRmgStation): LocalisedText =>
  stn.localisedName ?? { zh: stn.name?.[0], en: stn.name?.[1] }

const toInterchange = (line: RawInterchange): InterchangeLine => ({
  theme: line.theme as Theme | undefined,
  name: { zh: line.name?.[0], en: line.name?.[1] },
})

export const toTransfers = (stn: RawRmgStation): Transfer[] => {
  const groups = stn.transfer?.groups
  if (groups) {
    return groups
      .filter((group) => (group.lines ?? []).length > 0)
      .map((group) => ({
        kind: 'in-station' as const,
        paidArea: true,
        lines: (group.lines ?? []).map(toInterchange),
      }))
  }
  // 旧格式：info[0] 同站换乘、info[1] 出站换乘、info[2] 系统外换乘
  return (stn.transfer?.info ?? [])
    .map((group, index) => ({
      kind: KIND_BY_INDEX[index] ?? 'out-of-system',
      paidArea: index === 0,
      lines: (group ?? []).map((raw) => ({
        theme: raw.slice(0, 4) as Theme,
        name: { zh: raw[4], en: raw[5] },
      })),
    }))
    .filter((group) => group.lines.length > 0)
}

/**
 * 从邻接表还原主干与支线。主干是终点连到 `lineend` 的链；其余从主干分出的链是支线。
 */
export const traverseRmgStations = (
  stnList: Record<string, RawRmgStation>,
): { main: string[]; branches: string[][] } => {
  const start = stnList.linestart?.children?.[0]
  if (!start) return { main: [], branches: [] }

  const paths: string[][] = []
  const visit = (id: string, path: string[]) => {
    const current = [...path, id]
    const children = (stnList[id]?.children ?? []).filter(
      (c) => !PSEUDO.has(c) && !current.includes(c),
    )
    if (!children.length) {
      paths.push(current)
      return
    }
    for (const c of children) visit(c, current)
  }
  visit(start, [])

  const reachesEnd = (path: string[]) =>
    (stnList[path[path.length - 1]]?.children ?? []).includes('lineend')
  const main = paths.find(reachesEnd) ?? [...paths].sort((a, b) => b.length - a.length)[0] ?? []

  const branches = paths
    .filter((path) => path !== main)
    .map((path) => {
      const index = path.findIndex((id) => !main.includes(id))
      return index === -1 ? [] : path.slice(index)
    })
    .filter((branch) => branch.length)

  return { main, branches }
}

/**
 * 把一份 rmg 站表转换为 metro 的线路与站点。
 * `lineId` 用于匹配合肥轨道色板；找不到时沿用 rmg 自带的线色。
 */
export const fromRmgParam = (
  raw: RawRmgParam,
  lineId: string,
): { line: Line; stations: Record<string, Station> } => {
  const palette = getPaletteEntry(lineId)
  const { main, branches } = traverseRmgStations(raw.stn_list)

  const stations: Record<string, Station> = {}
  const newStn = (id: string, stn: RawRmgStation): Station => ({
    id,
    name: toLocalised(stn),
    secondaryName:
      stn.localisedSecondaryName ??
      (stn.secondaryName ? { zh: stn.secondaryName[0], en: stn.secondaryName[1] } : undefined),
    code: stn.num && stn.num !== '00' ? stn.num : undefined,
    transfers: toTransfers(stn),
    services: (stn.services ?? ['local']).filter((s): s is ServiceKind =>
      SERVICES.includes(s as ServiceKind),
    ),
    noService: stn.underConstruction ? 'under-construction' : undefined,
  })

  for (const id of main) stations[id] = newStn(id, raw.stn_list[id])
  for (const branch of branches)
    for (const id of branch) stations[id] = newStn(id, raw.stn_list[id])

  return {
    line: {
      id: lineId,
      name: { zh: raw.line_name[0], en: raw.line_name[1] },
      theme: palette
        ? [HEFEI_CITY_ID, palette.id, palette.colour, palette.fg]
        : [raw.theme[0], raw.theme[1], raw.theme[2] as `#${string}`, raw.theme[3] as Theme[3]],
      stations: main,
      branches: branches.length ? branches : undefined,
    },
    stations,
  }
}

/**
 * 把多条线的 rmg 站表合并成一个线网。
 *
 * 合并是按**站名**进行的：rmg 里同一座换乘站在每条线中各有一份、站 id 互不相同，
 * 因此用中文名（其次英文名）作为全局键替换为单一的站点 id。
 */
export const fromRmgParams = (params: Record<string, RawRmgParam>): Network => {
  const lines: Line[] = []
  const stations: Record<string, Station> = {}
  const idByKey = new Map<string, string>()

  const keyOf = (stn: Station) => stn.name.zh ?? stn.name.en ?? stn.id

  const mappedIds = new Map<string, Map<string, string>>()
  const getLineRemap = (lineId: string) => {
    let m = mappedIds.get(lineId)
    if (m) return m
    m = new Map()
    mappedIds.set(lineId, m)
    return m
  }

  for (const [lineId, raw] of Object.entries(params)) {
    const converted = fromRmgParam(raw, lineId)
    const remap = getLineRemap(lineId)

    // 注册每个站，同名合并
    for (const station of Object.values(converted.stations)) {
      const key = keyOf(station)
      const existingId = idByKey.get(key)
      if (existingId) {
        remap.set(station.id, existingId)
        const existing = stations[existingId]
        const seen = new Set(existing.transfers.flatMap((t) => t.lines.map((l) => l.name.zh)))
        for (const transfer of station.transfers) {
          const fresh = transfer.lines.filter((l) => !seen.has(l.name.zh))
          if (fresh.length) existing.transfers.push({ ...transfer, lines: fresh })
        }
      } else {
        idByKey.set(key, station.id)
        stations[station.id] = station
        remap.set(station.id, station.id)
      }
    }

    const mapId = (id: string) => remap.get(id) ?? id
    lines.push({
      ...converted.line,
      stations: converted.line.stations.map(mapId),
      branches: converted.line.branches?.map((branch) => branch.map(mapId)),
    })
  }

  return { id: HEFEI_CITY_ID, name: '合肥轨道', lines, stations }
}
