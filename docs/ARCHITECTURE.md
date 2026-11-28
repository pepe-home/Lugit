# ARCHITECTURE — metro

## 系统概述

- 整体结构：

```
src/data/hefei.ts ─┐
src/data/palette.ts┴─► Network（core/model.ts）
                          │
                    StationPov（哪条线/哪一站/哪一向/开哪侧门）
                          │
                 ┌────────┴─────────┐
           getMaterialInfo()   composeAnnouncement()
           （core/material.ts）  （core/announce.ts）
                 │                  │
                 ▼                  ▼
      materials/{destination,runin,railmap,announce}.tsx   ← LED：materials/led/
                 │
           编辑器（components/editor/）+ zustand（state/）
                 │
           lib/export.ts（SVG→PNG） → 浏览器下载
```

## 核心模块

| 模块                               | 职责                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 线网模型 `src/core/model.ts`       | 定义 `Network / Line / Station / Transfer / StationPov / Project`；双语 `LocalisedText`、线色 `Theme` 与 rmg 可迁移字段 |
| 行程推导 `src/core/material.ts`    | 由视角沿线路走向得到剩余站序、已过站、下一站、终点站与相关换乘                                                          |
| 报播文案 `src/core/announce.ts`    | 场景判定（自动 / 指定）、模板占位符替换、整线播报序列                                                                   |
| 布局 `src/core/layout.ts`          | 关键路径法求主干顺序，等距排布并处理支线；站态计算                                                                      |
| rmg 导入 `src/core/rmg-import.ts`  | 解析 RMGParam 的 parents/children 邻接表，迁移旧字段，多名合并                                                          |
| 合肥数据 `src/data/hefei.ts`       | 9 条线的站序、暂缓开通站、换乘与出站换乘备注                                                                            |
| 官方线色 `src/data/palette.ts`     | 9 条线的色值与色名，输出 `Theme`                                                                                        |
| LED 渲染 `src/materials/led/`      | 像素字体栅格化（`pixel-font.ts`）与点阵屏组件（`led.tsx`）                                                              |
| 物料组件 `src/materials/`          | 四类物料的 SVG，共享 `canvas.tsx`、`station-name.tsx`、`line-badge.tsx`                                                 |
| 导出 `src/lib/export.ts`           | 序列化内联计算样式的 SVG，生成 PNG 或直接下载 SVG                                                                       |
| 状态 `src/state/`                  | `project.ts`（落盘的项目文档）、`editor.ts`（会话内的视图与样式选项）                                                   |
| 编辑器 UI `src/components/editor/` | 顶栏、预览、控制面板                                                                                                    |

## 模块关系

- `core/` 只依赖 `data/` 与彼此，不依赖 React；`materials/` 依赖 `core/`；`components/` 依赖 `state/` 与 `materials/`。
- `core/material.ts` 是物料内容的唯一入口；`materials/announce.tsx` 额外直接调用 `core/announce.ts`。
- 布局只在路线图中使用（`layoutLine`），其余物料按线性顺序排版。

## 数据流

- 视角变更（控制面板）→ `useProjectStore.updatePov` → `project.pov` 更新并写入 localStorage → 各物料组件重新订阅派生数据 → 重新渲染。
- 放送机模板编辑 → `useEditorStore.updateTemplate`（不落盘）→ `composeAnnouncement` 输出中英文文本 → `LedText` 异步栅格化 → 点阵显示。
- 导出 → `isExporting=true` → 动画切到静态帧 → 从 DOM 取四份 `svg#metro-*` → 序列化 → 下载 / 光栅化。

## 外部系统

- GitHub Pages：`vp build` 产物由 `.github/workflows/deploy.yml` 发布；`base` 由 CI 注入的 `PAGES_BASE_PATH` 决定。
- 无后端。数据来源为中文维基百科与高德线网（详见 `src/data/hefei.ts` 文件头），运行时不联网。
- 字体：像素字体随 `public/fonts/led/` 打包，不使用外部 CDN。

## 重要技术边界

- localStorage 是唯一持久化；清空浏览器数据即丢失自定义视角与模板。
- PNG 导出依赖浏览器对 `SVG` 光栅化的支持，`<title>` 与 `filter` 等元素需在序列化后仍可渲染。
- 像素字体是固定的 12px 网格；更换字体会影响点阵密度与排版，需同步 `pitch` 逻辑。
