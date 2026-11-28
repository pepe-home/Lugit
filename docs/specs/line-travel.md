# Spec — 线网行程与物料信息

## 要构建什么

- 目标：给定线网与视角（线路、当前站、行车方向、交路终点、开门侧），推导出任何物料需要的事实：剩余站序、已过站、下一站、本次列车终点站、是否下一站即终点站、相关换乘。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：行程推导 `src/core/material.ts`。
- 对应源码入口（文件 / 路径）：`src/core/material.ts`（`getMaterialInfo`、`walkRoute`、`walkBackward`）。

## 行为

- 预期行为：沿 `Line.stations` 顺序（及支线连接）向行车方向前进，直到交路终点或线路尽头；反向可达站点为「已经过的站」；下一站为剩余站序的第二项。

## 输入 / 输出

- 输入：`Network`、`StationPov`。
- 输出：`MaterialInfo`（`route`、`passed`、`nextIds`、`terminalId`、`isNextTerminal`、`atTerminal`、`nextInterchanges`、`currentInterchanges`、`currentName`/`nextName`/`terminalName`）。

## 约束

- 不依赖 React；不读写 localStorage；对不存在的线路或站点返回空结构而非抛错。

## 边界条件

- 当前站即终点站：`atTerminal=true`，`nextIds` 为空。
- 下一站即终点站：`isNextTerminal=true`。
- 视角线路不存在：回退到第一条线路；当前站不在任何线路上：路线长度 1。

## 验收标准

- [ ] 1 号线大东门向左 → 下一站包公园，终点站九联圩，已过站自明光路起共 6 站（`src/core/core.test.ts` travel along a line）。
- [ ] 指定交路终点后路线在该站终止（`stops at the train terminal`）。
- [ ] 终点站的自动场景为到站·终点站，倒数第二站为离站·下一站为终点站。

## 完成定义

- 如何判定已完成：上述测试通过，且四类物料均只通过 `getMaterialInfo` 获取行程事实。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「行程推导」）；下对齐（`src/core/material.ts` 与 `src/core/core.test.ts`）。
