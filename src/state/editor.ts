/**
 * 编辑器的全部界面状态（不落盘）。
 */

import { create } from 'zustand'
import type { AnnounceScene, SceneMode } from '@/core/announce'
import { DEFAULT_TEMPLATES, type AnnounceTemplates } from '@/core/announce'
import type { CanvasKind, GeoPoint } from '@/core/model'
import type { LedColour } from '@/materials/led/led'
import type { BasemapId } from '@/lib/basemap'

/** 工作区：线网（编辑线路与站点）与车站（为该站制作物料）。 */
export type Workspace = 'network' | 'station'

/** 线网工作区的画布：地图编辑器或单线示意。 */
export type NetworkView = 'map' | 'schematic'

/** 地图交互模式：选择 / 拖动，或点击地图延伸线路。 */
export type MapMode = 'select' | 'draw'

export interface EditorState {
  workspace: Workspace
  activeCanvas: CanvasKind
  ledColour: LedColour
  scene: SceneMode
  templates: AnnounceTemplates
  /** 导出下载时置真，动画元素渲染静态帧。 */
  isExporting: boolean
  networkView: NetworkView
  basemap: BasemapId
  mapMode: MapMode
  /** 地图中心（WGS-84），新建线路时作为落点。 */
  viewCenter: GeoPoint
  viewZoom: number
  /** 首次进入线网地图时为 false，用于做一次「适应线网」。 */
  viewInitialised: boolean
  setWorkspace: (workspace: Workspace) => void
  setActiveCanvas: (kind: CanvasKind) => void
  setLedColour: (colour: LedColour) => void
  setScene: (scene: SceneMode) => void
  updateTemplate: (scene: AnnounceScene, patch: { zh?: string; en?: string }) => void
  resetTemplates: () => void
  setIsExporting: (value: boolean) => void
  setNetworkView: (view: NetworkView) => void
  setBasemap: (basemap: BasemapId) => void
  setMapMode: (mode: MapMode) => void
  setView: (center: GeoPoint, zoom: number) => void
  markViewInitialised: () => void
}

export const useEditorStore = create<EditorState>()((set) => ({
  workspace: 'station',
  activeCanvas: 'plate',
  ledColour: 'amber',
  scene: 'auto',
  templates: DEFAULT_TEMPLATES,
  isExporting: false,
  networkView: 'map',
  basemap: 'amap',
  mapMode: 'select',
  viewCenter: { lat: 31.863, lng: 117.283 },
  viewZoom: 11,
  viewInitialised: false,
  setWorkspace: (workspace) => set({ workspace }),
  setActiveCanvas: (activeCanvas) => set({ activeCanvas }),
  setLedColour: (ledColour) => set({ ledColour }),
  setScene: (scene) => set({ scene }),
  updateTemplate: (scene, patch) =>
    set((state) => ({
      templates: { ...state.templates, [scene]: { ...state.templates[scene], ...patch } },
    })),
  resetTemplates: () => set({ templates: DEFAULT_TEMPLATES }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setNetworkView: (networkView) => set({ networkView }),
  setBasemap: (basemap) => set({ basemap }),
  setMapMode: (mapMode) => set({ mapMode }),
  setView: (viewCenter, viewZoom) => set({ viewCenter, viewZoom }),
  markViewInitialised: () => set({ viewInitialised: true }),
}))
