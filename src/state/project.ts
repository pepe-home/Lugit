/**
 * 项目状态：用 zustand 单 store 持有整个 Project，并自动保存到 localStorage。
 *
 * 只有一份项目文档、没有跨面板的事件流，编辑器又需要频繁做部分更新，
 * 因此用 zustand + 不可变更新，而不是 Redux Toolkit。
 *
 * 线网编辑（增删线、增删站、调序、改名、改线色、合并 / 拆分换乘站）改的是同一份 `Network`；
 * 结构性修改后统一调用 `recomputeTransfers`，换乘关系不手工维护。
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildSeedProject } from '@/data/hefei'
import { HEFEI_CITY_ID, HEFEI_PALETTE } from '@/data/palette'
import {
  CURRENT_PROJECT_VERSION,
  type CanvasKind,
  type GeoPoint,
  type Line,
  type LocalisedText,
  type Network,
  type Project,
  type Station,
  type StationPov,
  type Theme,
} from '@/core/model'
import { detachStation, mergeStationInto, recomputeTransfers } from '@/core/network'

export const STORAGE_KEY = 'metro-project'

/** 新建站点没有坐标时的落点（合肥市中心）。 */
export const DEFAULT_GEO: GeoPoint = { lat: 31.863, lng: 117.283 }

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

const makeStation = (name: LocalisedText, geo?: GeoPoint): Station => ({
  id: uid('s'),
  name,
  geo,
  transfers: [],
  services: ['local'],
})

export const createSeedProject = (): Project => {
  const { network, pov } = buildSeedProject()
  return {
    version: CURRENT_PROJECT_VERSION,
    name: '合肥轨道线网',
    network,
    pov,
    canvas: {
      sizes: {
        plate: { width: 1200, height: 300 },
        // 宽度是下限，站点多时线路牌会自动加宽
        board: { width: 1600, height: 320 },
        announce: { width: 1200, height: 260 },
      },
      language: 'both',
    },
  }
}

/** 用新的线网替换项目中的线网，并保持视角指向仍然存在的站点。 */
const withNetwork = (project: Project, network: Network, pov: StationPov): Project => ({
  ...project,
  network,
  pov,
})

export interface ProjectState {
  project: Project
  setProject: (project: Project) => void
  updateProject: (patch: Partial<Omit<Project, 'network' | 'pov' | 'canvas'>>) => void
  updatePov: (patch: Partial<StationPov>) => void
  updateCanvasSize: (kind: CanvasKind, size: { width: number; height: number }) => void
  updateLanguage: (language: Project['canvas']['language']) => void
  updateLineName: (lineId: string, name: LocalisedText) => void
  updateLineTheme: (lineId: string, theme: Theme) => void
  addLine: (center: GeoPoint) => void
  removeLine: (lineId: string) => void
  addStation: (lineId: string, afterId?: string, geo?: GeoPoint) => void
  moveStation: (lineId: string, stationId: string, delta: number) => void
  removeStation: (lineId: string, stationId: string) => void
  renameStation: (stationId: string, name: LocalisedText) => void
  moveStationTo: (stationId: string, geo: GeoPoint) => void
  mergeStations: (sourceId: string, targetId: string) => void
  splitStation: (lineId: string, stationId: string) => void
  resetNetwork: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      project: createSeedProject(),
      setProject: (project) => set({ project }),
      updateProject: (patch) => set((state) => ({ project: { ...state.project, ...patch } })),
      updatePov: (patch) =>
        set((state) => ({
          project: { ...state.project, pov: { ...state.project.pov, ...patch } },
        })),
      updateCanvasSize: (kind, size) =>
        set((state) => ({
          project: {
            ...state.project,
            canvas: {
              ...state.project.canvas,
              sizes: { ...state.project.canvas.sizes, [kind]: size },
            },
          },
        })),
      updateLanguage: (language) =>
        set((state) => ({
          project: { ...state.project, canvas: { ...state.project.canvas, language } },
        })),
      updateLineName: (lineId, name) =>
        set((state) => ({
          project: {
            ...state.project,
            network: {
              ...state.project.network,
              lines: state.project.network.lines.map((line) =>
                line.id === lineId ? { ...line, name } : line,
              ),
            },
          },
        })),
      updateLineTheme: (lineId, theme) =>
        set((state) => ({
          project: {
            ...state.project,
            network: {
              ...state.project.network,
              lines: state.project.network.lines.map((line) =>
                line.id === lineId ? { ...line, theme } : line,
              ),
            },
          },
        })),
      addLine: (center) =>
        set((state) => {
          const { project } = state
          const index = project.network.lines.length
          const entry = HEFEI_PALETTE[index % HEFEI_PALETTE.length]
          const first = makeStation(
            { zh: '起点站', en: 'Origin' },
            {
              lat: center.lat,
              lng: center.lng - 0.01,
            },
          )
          const second = makeStation(
            { zh: '终点站', en: 'Terminus' },
            {
              lat: center.lat,
              lng: center.lng + 0.01,
            },
          )
          const line: Line = {
            id: uid('line'),
            name: { zh: `新线路 ${index + 1}`, en: `New Line ${index + 1}` },
            theme: [HEFEI_CITY_ID, entry.id, entry.colour, entry.fg],
            stations: [first.id, second.id],
          }
          const network = recomputeTransfers({
            ...project.network,
            lines: [...project.network.lines, line],
            stations: {
              ...project.network.stations,
              [first.id]: first,
              [second.id]: second,
            },
          })
          return {
            project: withNetwork(project, network, {
              ...project.pov,
              lineId: line.id,
              currentStationId: first.id,
              trainTerminalId: undefined,
            }),
          }
        }),
      removeLine: (lineId) =>
        set((state) => {
          const { project } = state
          const { network } = project
          if (network.lines.length <= 1) return state
          const lines = network.lines.filter((line) => line.id !== lineId)
          if (lines.length === network.lines.length) return state

          const used = new Set(
            lines.flatMap((line) => [...line.stations, ...(line.branches ?? []).flat()]),
          )
          const stations = Object.fromEntries(
            Object.entries(network.stations).filter(([id]) => used.has(id)),
          )
          const nextNetwork = recomputeTransfers({ ...network, lines, stations })
          const pov =
            project.pov.lineId === lineId
              ? {
                  ...project.pov,
                  lineId: lines[0].id,
                  currentStationId: lines[0].stations[0],
                  trainTerminalId: undefined,
                }
              : project.pov
          return { project: withNetwork(project, nextNetwork, pov) }
        }),
      addStation: (lineId, afterId, geo) =>
        set((state) => {
          const { project } = state
          const line = project.network.lines.find((l) => l.id === lineId)
          if (!line) return state
          const anchor = afterId ? project.network.stations[afterId] : undefined
          const stationGeo =
            geo ??
            (anchor?.geo ? { lat: anchor.geo.lat, lng: anchor.geo.lng + 0.0035 } : DEFAULT_GEO)
          const station = makeStation({ zh: '新车站', en: 'New Station' }, stationGeo)
          const stations = [...line.stations]
          const at = afterId ? stations.indexOf(afterId) : stations.length - 1
          stations.splice(at + 1, 0, station.id)
          const lines = project.network.lines.map((l) => (l.id === lineId ? { ...l, stations } : l))
          const network = recomputeTransfers({
            ...project.network,
            lines,
            stations: { ...project.network.stations, [station.id]: station },
          })
          return {
            project: withNetwork(project, network, {
              ...project.pov,
              currentStationId: station.id,
            }),
          }
        }),
      moveStation: (lineId, stationId, delta) =>
        set((state) => {
          const { project } = state
          const line = project.network.lines.find((l) => l.id === lineId)
          if (!line) return state
          const index = line.stations.indexOf(stationId)
          const target = index + delta
          if (index < 0 || target < 0 || target >= line.stations.length) return state
          const stations = [...line.stations]
          ;[stations[index], stations[target]] = [stations[target], stations[index]]
          const lines = project.network.lines.map((l) => (l.id === lineId ? { ...l, stations } : l))
          const network = recomputeTransfers({ ...project.network, lines })
          return { project: withNetwork(project, network, project.pov) }
        }),
      removeStation: (lineId, stationId) =>
        set((state) => {
          const { project } = state
          const line = project.network.lines.find((l) => l.id === lineId)
          if (!line || line.stations.length <= 2) return state
          const index = line.stations.indexOf(stationId)
          if (index < 0) return state

          const stations2 = line.stations.filter((id) => id !== stationId)
          const lines = project.network.lines.map((l) =>
            l.id === lineId ? { ...l, stations: stations2 } : l,
          )
          const stillUsed = lines.some(
            (l) =>
              l.stations.includes(stationId) ||
              (l.branches ?? []).some((b) => b.includes(stationId)),
          )
          const stations = { ...project.network.stations }
          if (!stillUsed) delete stations[stationId]
          const network = recomputeTransfers({ ...project.network, lines, stations })

          const pov =
            project.pov.currentStationId === stationId
              ? {
                  ...project.pov,
                  currentStationId: stations2[Math.min(index, stations2.length - 1)],
                }
              : project.pov
          return { project: withNetwork(project, network, pov) }
        }),
      renameStation: (stationId, name) =>
        set((state) => {
          const station = state.project.network.stations[stationId]
          if (!station) return state
          return {
            project: {
              ...state.project,
              network: {
                ...state.project.network,
                stations: {
                  ...state.project.network.stations,
                  [stationId]: { ...station, name },
                },
              },
            },
          }
        }),
      moveStationTo: (stationId, geo) =>
        set((state) => {
          const station = state.project.network.stations[stationId]
          if (!station) return state
          return {
            project: {
              ...state.project,
              network: {
                ...state.project.network,
                stations: {
                  ...state.project.network.stations,
                  [stationId]: { ...station, geo },
                },
              },
            },
          }
        }),
      mergeStations: (sourceId, targetId) =>
        set((state) => {
          const { project } = state
          const network = mergeStationInto(project.network, sourceId, targetId)
          if (network === project.network) return state
          const pov =
            project.pov.currentStationId === sourceId
              ? { ...project.pov, currentStationId: targetId, trainTerminalId: undefined }
              : project.pov
          return { project: withNetwork(project, network, pov) }
        }),
      splitStation: (lineId, stationId) =>
        set((state) => {
          const { project } = state
          const newId = uid('s')
          const network = detachStation(project.network, lineId, stationId, newId)
          if (network === project.network) return state
          const pov =
            project.pov.lineId === lineId && project.pov.currentStationId === stationId
              ? { ...project.pov, currentStationId: newId }
              : project.pov
          return { project: withNetwork(project, network, pov) }
        }),
      resetNetwork: () => set({ project: createSeedProject() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_PROJECT_VERSION,
      // 旧版本（四种物料、无坐标、非方向性行程）直接回到种子项目，不做逐字段迁移
      migrate: () => ({ project: createSeedProject() }),
      // 只落盘项目文档；动作在每次创建 store 时重新生成
      partialize: (state) => ({ project: state.project }),
    },
  ),
)
