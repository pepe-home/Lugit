# Spec — 线网地图

## 要构建什么

- 目标：在真实底图上展示全网线路与站点，支持拖动站点、点击延伸、拖拽合并换乘、切换底图；地图只服务线网编辑，不影响车站物料。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：地图编辑器 `src/components/editor/network-map.tsx`、坐标与底图 `src/lib/coord.ts`、`src/lib/basemap.ts`。
- 对应源码入口（文件 / 路径）：`src/components/editor/network-map.tsx`、`src/lib/basemap.ts`（`BASEMAPS`、`toDisplay`、`toWgs`）、`src/lib/coord.ts`（`wgs84ToGcj02`、`gcj02ToWgs84`）、`src/data/hefei-geo.ts`。

## 行为

- 首次进入线网工作区时按全部站点范围自适应缩放，之后记住视图中心与缩放。
- 线路按官方线色绘制（当前线加粗），换乘站用双环标记，当前站放大并加线色光晕。
- 站名标签：换乘站与当前站常显，当前线路的其余站名在缩放 ≥ 12 时常显；其余悬停显示。
- 点击站点选中并把视角切到该站所属线路；点击「延伸线路」后，地图点击在当前站之后追加新站。
- 拖动站点写入新坐标；落点距另一站 ≤ 120 米且不在同一线时，确认后合并为换乘站。
- 底图可选高德 / 浅色 / OSM / 无底图；跨越 GCJ-02 与 WGS-84 时换算视野中心，地图不跳。

## 输入 / 输出

- 输入：`Project`（线网与视角）、编辑器状态（底图、模式、视图）。
- 输出：对项目 store 的编辑动作；地图本身不落盘。

## 约束

- 地图组件必须动态 import，Leaflet 与瓦片不得进入首屏包。
- 站点坐标只以 WGS-84 写入项目；高德底图下显示坐标由 `toDisplay` 换算，拖动结果由 `toWgs` 转回。
- 卸载时必须 `map.remove()` 并断开 `ResizeObserver`，避免切换视图后残留监听。
- 物料与线路示意不读取任何地图状态。

## 边界条件

- 底图瓦片加载失败：线路与站点仍然渲染，只是没有底图。
- 站点缺少坐标：不绘制该站与相关线段（种子数据 205 站全部有坐标）。
- 拖动到同线站点附近：不触发合并，按普通移动处理。
- `window.confirm` 取消合并：站点仍移动到落点。

## 验收标准

- [ ] 站点标记与高德底图上的同名 POI 对齐（GCJ-02 换算正确）。
- [ ] 拖动「大东门」后 `project.network.stations['s-大东门'].geo` 改变并写入 localStorage。
- [ ] 「延伸线路」模式下点击地图，当前线路站数 +1，新站成为当前站。
- [ ] 合并 / 拆分后换乘列表与线路折线即时更新。
- [ ] 构建产物中 Leaflet 位于独立 chunk，首屏 JS 不含 Leaflet。

## 完成定义

- 如何判定已完成：上述行为在浏览器中逐项验证；`vp check`、`vp test`、`vp build` 全部通过。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「地图编辑器」「坐标与底图」）；下对齐（`network-map.tsx`、`lib/basemap.ts`、`lib/coord.ts`、`src/core/core.test.ts`）。
