# 来源与许可

metro 以 GNU General Public License v3.0（GPL-3.0-only）发布，全文见 `LICENSE`。

本项目在算法、数据与文案模型上参考或复用了 Rail Map Toolkit 家族（同为 GPL-3.0）的成果：

- `railmapgen/rmg` — 线路布局的关键路径法（`src/core/layout.ts` 文件头标注）
- `railmapgen/rma` — 报站文案的场景与模板模型（`src/core/announce.ts` 文件头标注）
- `railmapgen/rmg-import` 相关的 RMGParam 结构 — 导入器字段迁移（`src/core/rmg-import.ts` 文件头标注）
- `railmapgen/rmg-palette` — 合肥轨道线色数据（`src/data/palette.ts` 文件头标注）

像素字体 Fusion Pixel Font（OFL-1.1）的许可文本随字体放在 `public/fonts/led/OFL.txt`。

合肥轨道线网站序与换乘关系来自中文维基百科与高德地图的公开资料，见 `src/data/hefei.ts` 文件头。

站点坐标来自 Wikidata 的坐标声明（P625，CC0），见 `src/data/hefei-geo.ts` 文件头。

地图底图瓦片在运行时从下列服务加载，不打包进本仓库，版权归各提供方所有：

- 高德地图（GCJ-02）— `webrd0*.is.autonavi.com`
- CARTO Basemaps — `basemaps.cartocdn.com`，© OpenStreetMap contributors © CARTO
- OpenStreetMap — `tile.openstreetmap.de`，© OpenStreetMap contributors

地图渲染使用 Leaflet（BSD-2-Clause），作为 npm 依赖引入，见 `package.json`。
