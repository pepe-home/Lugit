# Spec — 线网编辑

## 要构建什么

- 目标：在「线网」工作区编辑线路与站点：增删站、调整站序、改站名、改线名与线色；换乘关系始终由站点归属自动推导。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：线网重算 `src/core/network.ts`、状态 `src/state/project.ts`。
- 对应源码入口（文件 / 路径）：`src/state/project.ts`（`addStation` / `moveStation` / `removeStation` / `renameStation` / `updateLineName` / `updateLineTheme` / `resetNetwork`）、`src/core/network.ts`（`recomputeTransfers`、`lineMemberships`）、`src/components/editor/network-panel.tsx`、预览 `src/components/editor/preview.tsx` + `src/materials/line-map.tsx`。

## 行为

- 增站：在当前站之后插入一个名为「新车站 / New Station」的站点，并把它设为当前站。
- 调序：与相邻站交换位置，首站不能上移、末站不能下移。
- 删站：从当前线路移除；若该站不再被任何线路引用则删除站点记录；若删除的是当前站，视角落到原位置的相邻站。
- 改名：改写站点记录，所有经过该站的线路同步显示新站名（同一座物理站共用一条记录）。
- 改线名 / 线色：只影响该线路。
- 每次结构性修改（增删、调序）后调用 `recomputeTransfers`，换乘徽标随线路归属变化。

## 输入 / 输出

- 输入：线路 id、站点 id、名称、线色等编辑参数。
- 输出：新的 `Project`（含 `network`、必要的 `pov` 修正），并由 zustand persist 写入 localStorage。

## 约束

- 编辑动作集中在 `state/project.ts`，界面不得直接改 `project`。
- 一条线至少保留 2 站；不足 2 站时删除按钮禁用。
- 站点 id 不可变；改名不改变 id，因此换乘与物料引用不受影响。
- 没有撤销栈；唯一的恢复手段是「恢复内置线网」，会重置整个项目。

## 边界条件

- 删除换乘站：若另一条线仍经过该站，站点记录保留，换乘只剩其余线路（无换乘则清空）。
- 删除线路末端站：视角回落为新的末站。
- 站名清空：允许存在空站名，物料按空字符串渲染，不报错。
- 旧版本持久化数据：`CURRENT_PROJECT_VERSION` 不匹配时回到种子项目。

## 验收标准

- [ ] 删除某换乘站所在线路的引用后，该站 `transfers` 为空，且原线网对象不被就地修改（`src/core/core.test.ts` network edits）。
- [ ] 当前站已被移除时，视角落到相邻站，物料仍可渲染。
- [ ] 编辑后的线路示意与线路牌按新站序排列。

## 完成定义

- 如何判定已完成：上述测试通过，界面可完成增站 → 调序 → 删站的完整操作且预览即时刷新。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「线网重算」「状态」）；下对齐（`src/core/network.ts`、`src/state/project.ts`、`src/components/editor/network-panel.tsx`）。
