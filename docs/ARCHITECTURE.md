# ARCHITECTURE — metro

## 系统概述

- 整体结构：

```
src/data/hefei.ts ─┐
src/data/palette.ts┴─► Network（core/model.ts）◄── 线网编辑（增删站 / 调序 / 改名 / 改线色）
                          │                            └── recomputeTransfers（core/network.ts）
                    StationPov（哪条线 / 哪一站 / 哪一向 / 开哪侧门）
                          │
                 ┌────────┴─────────┐
           getMaterialInfo()   composeAnnouncement()
           （core/material.ts）  （core/announce.ts）
                 │                  │
                 ▼                  ▼
      materials/{station-plate,line-board,announce}.tsx   ← LED：materials/led/
                 │                  ▲
                 │         线网工作区预览：materials/line-map.tsx（线路示意）
                 │
           编辑器（components/editor/：线网 / 车站两个工作区）+ zustand（state/）
                 │
           lib/export.ts（SVG→PNG） → 浏览器下载
```

## 核心模块

| 模块                                  | 职责                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 线网模型 `src/core/model.ts`          | 定义 `Network / Line / Station / Transfer / StationPov / Project`；双语 `LocalisedText`、线色 `Theme` 与 rmg 可迁移字段 |
| 线网重算 `src/core/network.ts`        | 由站点归属推导换乘；编辑线网后统一重建 `transfers`                                                                      |
| 行程推导 `src/core/material.ts`       | 按行车方向得到剩余站序、已过站、下一站、终点站与相关换乘                                                                |
| 报播文案 `src/core/announce.ts`       | 场景判定（自动 / 指定）、模板占位符替换、整线播报序列                                                                   |
| 布局 `src/core/layout.ts`             | 关键路径法求主干顺序，等距排布并处理支线；站态计算                                                                      |
| rmg 导入 `src/core/rmg-import.ts`     | 解析 RMGParam 的 parents/children 邻接表，迁移旧字段，多名合并                                                          |
| 合肥数据 `src/data/hefei.ts`          | 9 条线的站序、暂缓开通站；换乘由 `recomputeTransfers` 生成                                                              |
| 官方线色 `src/data/palette.ts`        | 9 条线的色值与色名，输出 `Theme`                                                                                        |
| LED 渲染 `src/materials/led/`         | 像素字体栅格化（`pixel-font.ts`）与点阵屏组件（`led.tsx`）                                                              |
| 物料组件 `src/materials/`             | 站名牌、线路牌、报幕机的 SVG，共享 `canvas.tsx`、`station-name.tsx`、`line-badge.tsx`                                   |
| 线路示意 `src/materials/line-map.tsx` | 线网工作区的预览画布，按站数加宽，不参与物料导出                                                                        |
| 导出 `src/lib/export.ts`              | 序列化内联计算样式的 SVG，生成 PNG 或直接下载 SVG                                                                       |
| 状态 `src/state/`                     | `project.ts`（落盘的项目文档与线网编辑动作）、`editor.ts`（会话内的工作区与样式选项）                                   |
| 编辑器 UI `src/components/editor/`    | 顶栏、预览、右侧标签页（线网 / 车站）与两块面板                                                                         |

## 模块关系

- `core/` 只依赖 `data/` 与彼此，不依赖 React；`materials/` 依赖 `core/`；`components/` 依赖 `state/` 与 `materials/`。
- `core/material.ts` 是物料内容的唯一入口；`materials/announce.tsx` 额外直接调用 `core/announce.ts`。
- 线网编辑动作集中在 `state/project.ts`，结构性修改后调用 `core/network.ts` 的 `recomputeTransfers`。
- 布局只在“线路示意”中使用（`layoutLine`），三种物料按单行站序排版。

## 数据流

- 视角变更（车站工作区）→ `useProjectStore.updatePov` → `project.pov` 更新并写入 localStorage → 物料重新订阅派生数据 → 重新渲染。
- 线网编辑（线网工作区）→ 增删站 / 调序 / 改名 / 改线色 → `recomputeTransfers` → 项目落盘 → 线路示意与物料同步刷新。
- 报幕机模板编辑 → `useEditorStore.updateTemplate`（不落盘）→ `composeAnnouncement` 输出单行文本 → `LedText` 异步栅格化 → 点阵显示。
- 导出 → `isExporting=true` → 动画切到静态帧 → 从 DOM 取当前画布的 `svg#metro-*` → 序列化 → 下载 / 光栅化。

## 外部系统

- GitHub Pages：`vp build` 产物由 `.github/workflows/deploy.yml` 发布；`base` 由 CI 注入的 `PAGES_BASE_PATH` 决定。
- 无后端。数据来源为中文维基百科与高德线网（详见 `src/data/hefei.ts` 文件头），运行时不联网。
- 字体：像素字体随 `public/fonts/led/` 打包，不使用外部 CDN。

## 重要技术边界

- localStorage 是唯一持久化；清空浏览器数据即丢失自定义线网、视角与模板。
- 项目版本升级（`CURRENT_PROJECT_VERSION`）时旧数据直接回到种子项目，不做逐字段迁移。
- PNG 导出依赖浏览器对 `SVG` 光栅化的支持；LED 文字导出为静态帧，动画只在预览中播放。
- 像素字体是固定的 12px 网格；报幕机单行让 12 行点阵占满屏高，`pitch` 决定点距与“分辨率”。
- 线路牌宽度是下限，站点多时自动加宽；站名字号由最长站名与站距共同决定，英文站名更长时会显著缩小。
