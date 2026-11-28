# AGENTS.md

metro 是纯前端的地铁线网编辑与车站物料制作工具；改代码前先分清落在「线网数据」还是「物料呈现」哪一侧。

## 概述

- 本项目是什么：一份可编辑的线网数据（`src/data/hefei.ts` 提供种子）+ 三个车站物料组件 + 线网工作区的线路示意，由「线网 / 车站」两个工作区驱动；无服务端、无数据库，项目存 localStorage。

## 边界与范围

- 范围内：站点级线网编辑（增删站、调序、改名、改线名线色）；合肥轨道风格的站名牌、线路牌、报幕机；逐站切换视角；PNG / SVG 导出；整线播报文本导出；解析 rmg 项目文件的数据能力（`core/rmg-import.ts`，暂未接入界面）。
- 非目标（明确排除）：地图底图与拖放绘制线网、真实语音合成（只导出文本）、账号、云存储、SEO / 预渲染。

## Agent 操作指南

- 如何理解本项目：
  - 改**线网语义** → `src/core/`（模型、行程推导、报播文案、布局、换乘重算）与 `src/data/`，必须同步 `src/core/core.test.ts`。
  - 改**线网编辑动作** → `src/state/project.ts` 的 actions，结构性修改后调用 `recomputeTransfers`；界面在 `src/components/editor/network-panel.tsx`。
  - 改**物料外观** → `src/materials/`，验收看 `vp check`（类型）与编辑器里三份物料的截图；导出路径在 `src/lib/export.ts`。
  - 改**交互** → `src/components/editor/`（`control-panel` 是工作区标签壳，`station-panel` 是车站物料）与 `src/state/`。
- 全局规则 / 约定：
  1. 构建、检查、测试统一走 vp（`vp dev` / `vp check` / `vp test` / `vp build`），`package.json` 不写 `packageManager`。
  2. 界面文案目前以中文为主；新增界面文案先用中文，走 i18n 是后续决策，不在组件里混用语言。
  3. 来自 Rail Map Toolkit（rmg / rmg-palette / rma）的算法与文案模型在文件头标注来源与 GPL-3.0；不得把 `.reference/` 下的代码直接拷入而不标注。
  4. 物料 SVG 的类名统一 `metro-*`，样式集中在 `src/styles/globals.css`；导出依赖元素内联样式，不要把关键样式放进 Tailwind 类。
  5. LED 文字的渲染要确定性：导出时以 `isExporting` 冻结滚动动画，新增动画必须遵守同一约定。
  6. 物料类型固定为 `plate | board | announce`（`src/core/model.ts` 的 `CanvasKind`）；线网工作区的线路示意使用 `line-map`，不是物料，不参与车站物料导出。

## 目录速查

- `src/core/` — 线网模型、行程推导（`material.ts`）、报播文案（`announce.ts`）、布局（`layout.ts`）、换乘重算（`network.ts`）、rmg 导入（`rmg-import.ts`）；纯函数，无 React 依赖。
- `src/data/` — 合肥线网种子数据（`hefei.ts`）与官方线色（`palette.ts`）。
- `src/materials/` — 三种物料的 SVG 组件、线网工作区的线路示意（`line-map.tsx`）与共享排版组件（`led/`、`canvas.tsx`、`station-name.tsx`、`line-badge.tsx`）。
- `src/lib/export.ts` — SVG 序列化与 PNG 导出。
- `src/state/` — zustand store：`project.ts` 落盘（含线网编辑动作），`editor.ts` 会话内（工作区、当前物料、模板）。
- `src/components/editor/` — 顶栏、预览区、工作区标签与线网 / 车站两块面板。
- `.reference/` — 本机只读的 Rail Map Toolkit 参考仓库，不参与构建、不提交。
