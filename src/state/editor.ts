/**
 * 编辑器的全部界面状态（不落盘）。
 */

import { create } from 'zustand'
import type { AnnounceScene, SceneMode } from '@/core/announce'
import { DEFAULT_TEMPLATES, type AnnounceTemplates } from '@/core/announce'
import type { CanvasKind } from '@/core/model'
import type { DestinationStyle } from '@/materials/destination'
import type { LedColour } from '@/materials/led/led'

export interface EditorState {
  activeCanvas: CanvasKind
  destinationStyle: DestinationStyle
  ledColour: LedColour
  scene: SceneMode
  templates: AnnounceTemplates
  /** 导出下载时置真，动画元素渲染静态帧。 */
  isExporting: boolean
  setActiveCanvas: (kind: CanvasKind) => void
  setDestinationStyle: (style: DestinationStyle) => void
  setLedColour: (colour: LedColour) => void
  setScene: (scene: SceneMode) => void
  updateTemplate: (scene: AnnounceScene, patch: { zh?: string; en?: string }) => void
  resetTemplates: () => void
  setIsExporting: (value: boolean) => void
}

export const useEditorStore = create<EditorState>()((set) => ({
  activeCanvas: 'announce',
  destinationStyle: 'led',
  ledColour: 'amber',
  scene: 'auto',
  templates: DEFAULT_TEMPLATES,
  isExporting: false,
  setActiveCanvas: (activeCanvas) => set({ activeCanvas }),
  setDestinationStyle: (destinationStyle) => set({ destinationStyle }),
  setLedColour: (ledColour) => set({ ledColour }),
  setScene: (scene) => set({ scene }),
  updateTemplate: (scene, patch) =>
    set((state) => ({
      templates: { ...state.templates, [scene]: { ...state.templates[scene], ...patch } },
    })),
  resetTemplates: () => set({ templates: DEFAULT_TEMPLATES }),
  setIsExporting: (isExporting) => set({ isExporting }),
}))
