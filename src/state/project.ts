/**
 * 项目状态：用 zustand 单 store 持有整个 Project，并自动保存到 localStorage。
 *
 * 只有一份项目文档、没有跨面板的事件流，编辑器又需要频繁做部分更新，
 * 因此用 zustand + 不可变更新，而不是 Redux Toolkit。
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildSeedProject } from '@/data/hefei'
import {
  CURRENT_PROJECT_VERSION,
  type CanvasKind,
  type Project,
  type StationPov,
} from '@/core/model'

export const STORAGE_KEY = 'metro-project'

export const createSeedProject = (): Project => {
  const { network, pov } = buildSeedProject()
  return {
    version: CURRENT_PROJECT_VERSION,
    name: '合肥轨道线网',
    network,
    pov,
    canvas: {
      sizes: {
        destination: { width: 1200, height: 300 },
        runin: { width: 1200, height: 300 },
        railmap: { width: 2020, height: 300 },
        announce: { width: 1200, height: 300 },
      },
      language: 'both',
    },
  }
}

export interface ProjectState {
  project: Project
  setProject: (project: Project) => void
  updateProject: (patch: Partial<Omit<Project, 'network' | 'pov' | 'canvas'>>) => void
  updatePov: (patch: Partial<StationPov>) => void
  updateCanvasSize: (kind: CanvasKind, size: { width: number; height: number }) => void
  updateLanguage: (language: Project['canvas']['language']) => void
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
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // 只落盘项目文档；动作在每次创建 store 时重新生成
      partialize: (state) => ({ project: state.project }),
    },
  ),
)
