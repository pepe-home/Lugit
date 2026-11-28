# Spec — 物料渲染与导出

## 要构建什么

- 目标：三种车站物料（站名牌 / 线路牌 / 报幕机）共用同一画布外壳渲染为 SVG，可导出 PNG（2 倍分辨率）与 SVG；线网工作区的线路示意复用同一外壳，但不属于物料。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：物料组件 `src/materials/`、LED 渲染 `src/materials/led/`、导出 `src/lib/export.ts`。
- 对应源码入口（文件 / 路径）：`src/materials/index.tsx`（`Material`、`CANVAS_KINDS`）、`src/materials/{station-plate,line-board,announce}.tsx`、`src/materials/line-map.tsx`、`src/materials/canvas.tsx`（`MaterialCanvas`）、`src/lib/export.ts`（`exportPng`、`exportSvg`）、`src/components/editor/header.tsx`（`handleExport`）。

## 行为

- 站名牌：印刷版式，显示当前线路名称、站名（含英文）、当前行车方向的终点站；底部一条线色带。
- 线路牌：单行按行车方向排列全线主干站点；已过节点与区间置灰，未到节点用线色，当前站实心并加外圈；站名水平居中于节点下方。
- 报幕机：单行低分辨率点阵屏，12 行像素占满屏高；文字超出屏宽时循环滚动；中文优先，语言为英文时只显示英文。
- 导出：根元素 id 为 `metro-<kind>`（`plate` / `board` / `announce` / `line-map`）；线色通过 CSS 变量 `--metro-line-colour / --metro-line-fg` 注入；导出时冻结滚动动画并内联计算样式。

## 输入 / 输出

- 输入：`kind`、`Network`、`StationPov`、画布尺寸（线路牌宽度为下限）、`Theme`、`MaterialSettings`、`freeze`。
- 输出：`<svg>` 元素；导出为文件下载。

## 约束

- 物料不读取状态 store，全部 props 传入。
- 物料样式不得依赖 Tailwind 类（导出时 Tailwind 丢失）；只允许 `globals.css` 中的 `metro-*` 类。
- 站名字号只由“站距”与“实际显示语言的最长站名”决定，不逐站单独缩放。
- 线路牌的导出宽度由 `boardGeometry` 计算，可能大于设置的宽度下限。

## 边界条件

- 像素字体尚未加载：首帧只显示未点亮网格，加载完成后补绘制。
- 站名过长：站名牌按可用宽度收缩字号；线路牌按最长站名统一收缩，英文站名会显著更小。
- 线路牌站点很多：宽度按最小站距自动加宽，预览等比缩小。
- 浏览器不支持 `SVG` 到 `canvas`：抛错并在控制台记录，不生成空文件。

## 验收标准

- [ ] 三种物料与线路示意在预览区与导出的 PNG 中内容一致（报幕机为静态帧）。
- [ ] 导出的 SVG 在独立浏览器窗口中打开时字体、颜色与线条与预览一致。
- [ ] 每个画布都带 `viewBox`，等比缩放显示。
- [ ] 切换行车方向后，线路牌的置灰区间与“开往 X 方向”同步反转。

## 完成定义

- 如何判定已完成：三份物料与线路示意的截图检查通过，导出文件可用。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「物料组件」「LED 渲染」「导出」）；下对齐（`src/materials/`、`src/lib/export.ts`）。
