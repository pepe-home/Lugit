/**
 * 编辑器的全部界面状态（不落盘）。
 */

import { create } from 'zustand'
import type { AnnounceScene, SceneMode } from '@/core/announce'
import { DEFAULT_TEMPLATES, type AnnounceTemplates } from '@/core/announce'
import type { CanvasKind } from '@/core/model'
import type { LedColour } from '@/materials/led/led'

/** 工作区：线网（编辑线路与站点）与车站（为该站制作物料）。 */
export type Workspace = 'network' | 'station'

export interface EditorState {
  workspace: Workspace
  activeCanvas: CanvasKind
  ledColour: LedColour
  scene: SceneMode
  templates: AnnounceTemplates
  /** 导出下载时置真，动画元素渲染静态帧。 */
  isExporting: boolean
  setWorkspace: (workspace: Workspace) => void
  setActiveCanvas: (kind: CanvasKind) => void
  setLedColour: (colour: LedColour) => void
  setScene: (scene: SceneMode) => void
  updateTemplate: (scene: AnnounceScene, patch: { zh?: string; en?: string }) => void
  resetTemplates: () => void
  setIsExporting: (value: boolean) => void
}

export const useEditorStore = create<EditorState>()((set) => ({
  workspace: 'station',
  activeCanvas: 'plate',
  ledColour: 'amber',
  scene: 'auto',
  templates: DEFAULT_TEMPLATES,
  isExporting: false,
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
}))
