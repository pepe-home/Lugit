# AGENTS.md

metro 是纯前端的地铁线网与车站物料制作工具；改代码前先分清落在「线网数据」还是「物料呈现」哪一侧。

## 概述

- 本项目是什么：一份线网数据（`src/data/hefei.ts`）加上若干 SVG 物料组件（`src/materials/`），由编辑器界面（`src/components/editor/`）驱动；无服务端、无数据库，项目存 localStorage。

## 边界与范围

- 范围内：合肥轨道风格的终点站站牌、当前站名牌、路线图、放送机场画；逐站切换视角；PNG / SVG 导出；整线播报文本导出；导入 rmg 项目文件的数据能力（`core/rmg-import.ts`）。
- 非目标（明确排除）：地图底图与线网编辑界面（首期不做）、真实语音合成（只导出文本）、账号、云存储、SEO / 预渲染。

## Agent 操作指南

- 如何理解本项目：
  - 改**线网语义** → `src/core/`（模型、行程推导、报播文案、布局）与 `src/data/`，必须同步 `src/core/core.test.ts`。
  - 改**物料外观** → `src/materials/`，验收看 `vp check`（类型）与编辑器里四份物料的截图；导出路径在 `src/lib/export.ts`。
  - 改**交互** → `src/components/editor/` 与 `src/state/`。
- 全局规则 / 约定：
  1. 构建、检查、测试统一走 vp（`vp dev` / `vp check` / `vp test` / `vp build`），`package.json` 不写 `packageManager`。
  2. 界面文案目前以中文为主；新增界面文案先用中文，走 i18n 是后续决策，不在组件里混用语言。
  3. 来自 Rail Map Toolkit（rmg / rmg-templates / rma）的算法与文案模型在文件头标注来源与 GPL-3.0；不得把 `.reference/` 下的代码直接拷入而不标注。
  4. 物料 SVG 的类名统一 `metro-*`，样式集中在 `src/styles/globals.css`；导出依赖元素内联样式，不要把关键样式放进 Tailwind 类。
  5. LED 文字的渲染要确定性：导出时以 `isExporting` 冻结滚动动画，新增动画必须遵守同一约定。

## 目录速查

- `src/core/` — 线网模型、行程推导（`material.ts`）、报播文案（`announce.ts`）、布局（`layout.ts`）、rmg 导入（`rmg-import.ts`）；纯函数，无 React 依赖。
- `src/data/` — 合肥线网种子数据（`hefei.ts`）与官方线色（`palette.ts`）。
- `src/materials/` — 四类物料的 SVG 组件与共享排版组件（`led/`、`canvas.tsx`、`station-name.tsx`、`line-badge.tsx`）。
- `src/lib/export.ts` — SVG 序列化与 PNG 导出。
- `src/state/` — zustand store：`project.ts` 落盘，`editor.ts` 会话内。
- `src/components/editor/` — 顶栏、预览区、右侧控制面板。
- `.reference/` — 本机只读的 Rail Map Toolkit 参考仓库，不参与构建、不提交。
