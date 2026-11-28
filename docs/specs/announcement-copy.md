# Spec — 放送机文案

## 要构建什么

- 目标：把「视角 + 场景 + 模板」变成中英文两句播报，并能按行车方向导出整线播报。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：报播文案 `src/core/announce.ts`。
- 对应源码入口（文件 / 路径）：`src/core/announce.ts`（`composeAnnouncement`、`composeJourney`、`resolveScene`、`DEFAULT_TEMPLATES`）；界面入口 `src/components/editor/control-panel.tsx` 中 `AnnounceControls.handleExportScripts`。

## 行为

- 预期行为：场景为 `auto` 时，到终点站判定为「到站·终点站」，下一站为终点站判定为「离站·下一站为终点站」，其余为「离站」；模板占位符 `{station} {next} {terminal} {line} {doors} {interchange}` 被替换，未知占位符原样保留；换乘提示在离站场景取自下一站，在到站场景取自当前站。

## 输入 / 输出

- 输入：`Network`、`StationPov`、场景模式、模板表。
- 输出：`{ scene, values, texts: { zh, en } }`；整线导出为按站序排列的结果数组。

## 约束

- 空换乘生成空字符串（不留多余标点）；英文站名中的 `\` 断行符被替换为空格。

## 边界条件

- 手动指定与视角矛盾（例如在终点站指定离站）：仍按指定场景出文案，换乘取下一站（不存在时为空）。
- 模板清空：输出空字符串，不报错。

## 验收标准

- [ ] 大东门离站 → `下一站：包公园。开左门。` / `Next station: Baogongyuan. Doors will open on the left.`
- [ ] 终点站自动场景 → 文案包含「本次列车终点站」与英文对应句。
- [ ] 导出文本按行车方向覆盖全部站点，且不输出终点站之后的离站场景。

## 完成定义

- 如何判定已完成：上述断言在 `src/core/core.test.ts` 通过，界面「导出全线播报」下载的文本与画面一致。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「报播文案」）；下对齐（`src/core/announce.ts`、`src/materials/announce.tsx`、`src/core/core.test.ts`）。
