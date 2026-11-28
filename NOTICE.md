# 来源与许可

metro 以 GNU General Public License v3.0（GPL-3.0-only）发布，全文见 `LICENSE`。

本项目在算法、数据与文案模型上参考或复用了 Rail Map Toolkit 家族（同为 GPL-3.0）的成果：

- `railmapgen/rmg` — 线路布局的关键路径法（`src/core/layout.ts` 文件头标注）
- `railmapgen/rma` — 报站文案的场景与模板模型（`src/core/announce.ts` 文件头标注）
- `railmapgen/rmg-import` 相关的 RMGParam 结构 — 导入器字段迁移（`src/core/rmg-import.ts` 文件头标注）
- `railmapgen/rmg-palette` — 合肥轨道线色数据（`src/data/palette.ts` 文件头标注）

像素字体 Fusion Pixel Font（OFL-1.1）的许可文本随字体放在 `public/fonts/led/OFL.txt`。

合肥轨道线网站序与换乘关系来自中文维基百科与高德地图的公开资料，见 `src/data/hefei.ts` 文件头。
