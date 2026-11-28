# ARCHITECTURE — metro

## 系统概述

- 整体结构：

```
src/data/hefei.ts ─┐
src/data/hefei-geo.ts ─┴─► Network（core/model.ts，Station 带 WGS-84 坐标）
                                ▲            │
                地图编辑（拖放 / 点击延伸 / 合并换乘）
                                │            │
                        state/project.ts ──► core/network.ts（重算换乘、合并/拆分）
                                │            │
                                │       StationPov（哪条线 / 哪一站 / 哪一向 / 开哪侧门）
                                │            │
                                │   ┌────────┴─────────┐
                                │ getMaterialInfo()  composeAnnouncement()
                                │            │              │
                                │            ▼              ▼
                                │  materials/{station-plate,line-board,announce}.tsx
                                │  materials/line-map.tsx（线网示意，只读）
                                │            │
                        components/editor/{network-map,network-panel,station-panel}
                                │
                        lib/export.ts（SVG→PNG） → 浏览器下载
```

## 核心模块

| 模块                                               | 职责                                                                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 线网模型 `src/core/model.ts`                       | 定义 `Network / Line / Station / GeoPoint / StationPov / Project`；双语 `LocalisedText`、线色 `Theme` 与 rmg 可迁移字段 |
| 线网重算 `src/core/network.ts`                     | 由站点归属推导换乘；编辑后重建 `transfers`；合并两站、把换乘站拆回独立站                                                |
| 行程推导 `src/core/material.ts`                    | 按行车方向得到剩余站序、已过站、下一站、终点站与相关换乘                                                                |
| 报播文案 `src/core/announce.ts`                    | 场景判定（自动 / 指定）、模板占位符替换、整线播报序列                                                                   |
| 布局 `src/core/layout.ts`                          | 关键路径法求主干顺序，等距排布并处理支线；站态计算（线路示意用）                                                        |
| rmg 导入 `src/core/rmg-import.ts`                  | 解析 RMGParam 的 parents/children 邻接表，迁移旧字段，多名合并                                                          |
| 合肥数据 `src/data/hefei.ts`                       | 9 条线的站序、暂缓开通站；换乘由 `recomputeTransfers` 生成                                                              |
| 站点坐标 `src/data/hefei-geo.ts`                   | 205 站的 WGS-84 坐标（Wikidata P625），按中文站名索引                                                                   |
| 官方线色 `src/data/palette.ts`                     | 9 条线的色值与色名，输出 `Theme`                                                                                        |
| 地图编辑器 `src/components/editor/network-map.tsx` | Leaflet 底图、线路折线、站点标记；拖放、点击延伸、拖拽合并、底图切换                                                    |
| 坐标与底图 `src/lib/coord.ts`、`basemap.ts`        | WGS-84 ↔ GCJ-02 转换；高德 / CARTO / OSM / 无底图配置                                                                   |
| LED 渲染 `src/materials/led/`                      | 像素字体栅格化（`pixel-font.ts`）与点阵屏组件（`led.tsx`）                                                              |
| 物料组件 `src/materials/`                          | 站名牌、线路牌、报幕机的 SVG，共享 `canvas.tsx`、`station-name.tsx`、`line-badge.tsx`                                   |
| 线路示意 `src/materials/line-map.tsx`              | 线网工作区的只读单线示意，按站数加宽，不参与物料导出                                                                    |
| 导出 `src/lib/export.ts`                           | 序列化内联计算样式的 SVG，生成 PNG 或直接下载 SVG                                                                       |
| 状态 `src/state/`                                  | `project.ts`（落盘的项目文档与全部编辑动作）、`editor.ts`（会话内的工作区、地图视图与样式选项）                         |
| 编辑器 UI `src/components/editor/`                 | 顶栏、预览、右侧标签页（线网 / 车站）与两块面板                                                                         |

## 模块关系

- `core/` 只依赖 `data/` 与彼此，不依赖 React；`materials/` 依赖 `core/`；`components/` 依赖 `state/`、`materials/` 与 `lib/`。
- `core/material.ts` 是物料内容的唯一入口；`materials/announce.tsx` 额外直接调用 `core/announce.ts`。
- 线网编辑动作集中在 `state/project.ts`；结构性修改后调用 `core/network.ts` 的 `recomputeTransfers`、`mergeStationInto`、`detachStation`。
- 地图只在「线网」工作区挂载，并以动态 import 拆包；物料与线路示意不依赖 Leaflet。

## 数据流

- 视角变更（车站工作区）→ `useProjectStore.updatePov` → `project.pov` 更新并写入 localStorage → 物料重新订阅派生数据 → 重新渲染。
- 地图编辑（线网工作区）→ 拖动 / 点击 / 合并 → `moveStationTo`、`addStation`、`mergeStations`、`splitStation`、`addLine`、`removeLine` → 重算换乘 → 项目落盘 → 地图图层与物料同步刷新。
- 底图切换 → 仅更换瓦片图层；越过 GCJ-02 / WGS-84 边界时，把地图中心与全部站点坐标换算到新基准，视野不跳。
- 报幕机模板编辑 → `useEditorStore.updateTemplate`（不落盘）→ `composeAnnouncement` 输出单行文本 → `LedText` 异步栅格化 → 点阵显示。
- 导出 → `isExporting=true` → 动画切到静态帧 → 从 DOM 取当前画布的 `svg#metro-*` → 序列化 → 下载 / 光栅化。

## 外部系统

- GitHub Pages：`vp build` 产物由 `.github/workflows/deploy.yml` 发布；`base` 由 CI 注入的 `PAGES_BASE_PATH` 决定。
- 地图瓦片：高德（GCJ-02）/ CARTO / OpenStreetMap，运行时按需加载，不打包；每层在 Leaflet 中显示版权。
- 数据来源：中文维基百科与高德线网的站序；Wikidata 的站点坐标（WGS-84）。运行时不联网取数据，只有底图瓦片需要网络。
- 字体：像素字体随 `public/fonts/led/` 打包，不使用外部 CDN。

## 重要技术边界

- localStorage 是唯一持久化；清空浏览器数据即丢失自定义线网、视角与模板。
- 项目版本升级（`CURRENT_PROJECT_VERSION`）时旧数据直接回到种子项目，不做逐字段迁移。
- 站点坐标统一存 WGS-84；高德底图渲染前转 GCJ-02，拖动结果反向转回 WGS-84。两套基准不得混存。
- 线路几何由站点顺序连直线得到，不支持曲线、共线走向与真实轨道线形。
- 地图依赖在线瓦片；离线时只能看无底图模式下的线网。
- PNG 导出依赖浏览器对 `SVG` 光栅化的支持；LED 文字导出为静态帧，动画只在预览中播放。
