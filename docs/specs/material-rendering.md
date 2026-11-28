# Spec — 物料渲染与导出

## 要构建什么

- 目标：四类物料在同一画布外壳下渲染，输出 SVG；可导出 PNG（2 倍分辨率）与 SVG。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：物料组件 `src/materials/`、LED 渲染 `src/materials/led/`、导出 `src/lib/export.ts`。
- 对应源码入口（文件 / 路径）：`src/materials/index.tsx`（`Material`、`CANVAS_KINDS`）、`src/materials/canvas.tsx`（`MaterialCanvas`）、`src/lib/export.ts`（`exportPng`、`exportSvg`）、`src/components/editor/header.tsx`（`handleExport`）。

## 行为

- 预期行为：SVG 根元素 id 为 `metro-<kind>`；线色通过 CSS 变量 `--metro-line-colour / --metro-line-fg` 注入；LED 文字在 `freeze` 时静止、非 `freeze` 且超出可见宽度时循环滚动；导出时所有文本元素的计算样式被内联到副本。

## 输入 / 输出

- 输入：`kind`、`Network`、`StationPov`、画布尺寸、`Theme`、`MaterialSettings`、`freeze`。
- 输出：`<svg>` 元素；导出为文件下载。

## 约束

- 物料不读取状态 store，全部 props 传入。
- 物料样式不得依赖 Tailwind 类（导出时 Tailwind 丢失）；只允许 `globals.css` 中的 `metro-*` 类。

## 边界条件

- 像素字体尚未加载：首帧只显示未点亮网格，加载完成后补绘制。
- 站名过长：站名牌与终点站牌按可用宽度收缩字号；LED 文本改为滚动。
- 浏览器不支持 `SVG` 到 `canvas`：抛错并在控制台记录，不生成空文件。

## 验收标准

- [ ] 四类物料在预览区与导出的 PNG 中内容一致（LED 为静态帧）。
- [ ] 导出的 SVG 在独立浏览器窗口中打开时字体、颜色与线条与预览一致。
- [ ] 每个物料的 `svg` 都带 `viewBox`，等比缩放显示。

## 完成定义

- 如何判定已完成：四类物料截图检查通过，导出文件可用。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「物料组件」「LED 渲染」「导出」）；下对齐（`src/materials/`、`src/lib/export.ts`）。
