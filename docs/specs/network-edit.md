# Spec — 线网编辑

## 要构建什么

- 目标：在「线网」工作区编辑线路与站点：线路增删、站点增删 / 调序 / 改名、线名与线色；并把两条线的站点合并为换乘站或拆分回来。换乘关系始终由站点归属推导。

## 架构与代码对应

- 对应 ARCHITECTURE 模块职责：线网重算 `src/core/network.ts`、状态 `src/state/project.ts`、地图编辑器 `src/components/editor/network-map.tsx`。
- 对应源码入口（文件 / 路径）：
  - 动作：`src/state/project.ts`（`addLine` / `removeLine` / `addStation` / `moveStation` / `removeStation` / `renameStation` / `moveStationTo` / `mergeStations` / `splitStation` / `updateLineName` / `updateLineTheme` / `resetNetwork`）
  - 纯函数：`src/core/network.ts`（`recomputeTransfers`、`mergeStationInto`、`detachStation`、`linesOfStation`）
  - 界面：`src/components/editor/network-panel.tsx`、`network-map.tsx`

## 行为

- 新建线路：在期望地图中心生成「起点站 / 终点站」两站，使用下一个官方线色，名称「新线路 N」，并切换视角到新线。
- 删除线路：至少保留一条线路；删除后清理不再被任何线路引用的站点；若当前视角在该线上，切到第一条线路的首站。
- 增站：面板在当前站之后插入；地图「延伸线路」模式点击地图，按点击位置插入到当前站之后。
- 调序：与相邻站交换位置，首站不能上移、末站不能下移。
- 删站：从当前线路移除；若该站不再被任何线路引用则删除记录；删除当前站时视角落到原位置的相邻站；一条线至少保留 2 站。
- 改名：改写站点记录，所有经过该站的线路同步显示新站名（同一座物理站共用一条记录）。
- 合并换乘：地图上把一个站拖到另一站 120 米内确认合并，或在面板选择目标线 / 目标站后点「建立换乘」；被并入的站点记录删除，其线路改为经过目标站。
- 拆分换乘：在换乘列表中点击某条线的色块，把该线从此站拆出，生成同名独立站。
- 每次结构性修改后调用 `recomputeTransfers`，换乘徽标随线路归属变化。

## 输入 / 输出

- 输入：线路 id、站点 id、名称、线色、坐标等编辑参数。
- 输出：新的 `Project`（含 `network`、必要的 `pov` 修正），并由 zustand persist 写入 localStorage。

## 约束

- 编辑动作集中在 `state/project.ts`，界面不得直接改 `project`。
- 站位坐标一律 WGS-84；地图组件负责按底图基准换算，不得把 GCJ-02 写回项目。
- 站点 id 不可变；改名不改变 id，因此换乘与物料引用不受影响。
- 同一条线上的两站不能合并（避免同线重复站），`mergeStationInto` 直接返回原对象。
- 没有撤销栈；唯一的恢复手段是「恢复内置线网」，会重置整个项目。

## 边界条件

- 删除换乘站：若另一条线仍经过该站，站点记录保留，换乘只剩其余线路（无换乘则清空）。
- 合并目标与当前站已共线：面板候选只列出「尚未与当前线路共站」的站点；拖拽合并同线站点会被忽略。
- 拆分的同名新站没有编号区分，需要用户自行改名。
- 旧版本持久化数据：`CURRENT_PROJECT_VERSION` 不匹配时回到种子项目。

## 验收标准

- [ ] 删除某换乘站所在线路的引用后，该站 `transfers` 为空，且原线网对象不被就地修改（`src/core/core.test.ts` network edits）。
- [ ] 合并异线两站后，被并入站记录消失、目标站出现在两条线上且换乘包含另一条线（`transfer editing`）。
- [ ] 同线两站合并被拒绝（`refuses to merge two stations on the same line`）。
- [ ] 拆分换乘后，两条线各自持有独立站点记录（`detaches one line from an interchange`）。
- [ ] 当前站已被移除时，视角落到相邻站，物料仍可渲染。
- [ ] 地图上点击「延伸线路」后站点数 +1，新站坐标为点击位置附近；拖动站点后坐标改变并落盘。

## 完成定义

- 如何判定已完成：上述测试通过；界面可完成增线 → 拖站 → 合并 → 拆分 → 删线的完整操作且预览即时刷新。
- 双向对齐自检：上对齐（ARCHITECTURE 核心模块表「线网重算」「状态」「地图编辑器」）；下对齐（`src/core/network.ts`、`src/state/project.ts`、`src/components/editor/network-panel.tsx`、`network-map.tsx`）。
