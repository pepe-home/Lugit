/**
 * 线路颜色。
 *
 * 数据来源：Rail Map Toolkit 的 rmg-palette（GPL-3.0）与中文维基百科
 * `Module:Adjacent stations/合肥轨道交通`（2026-11-20 修订）；两者对 1–5 号线一致。
 * 色名取自合肥轨道 2023 年官方推文与线色公众投票结果。运行时不依赖任何外部包。
 * @see https://github.com/railmapgen/rmg-palette/blob/main/public/resources/palettes/hefei.json
 */

/** 线色的前景色（徽标上的文字颜色）。 */
export type MonoColour = '#000' | '#fff'

/**
 * @property 0 - 城市 id
 * @property 1 - 线路 id
 * @property 2 - 背景色
 * @property 3 - 前景色
 */
export type Theme = [city: string, line: string, colour: `#${string}`, fg: MonoColour]

export interface PaletteEntry {
  id: string
  /** 官方色名。 */
  colourName: string
  name: { zh: string; en: string }
  colour: `#${string}`
  fg: MonoColour
}

export const HEFEI_CITY_ID = 'hefei'

export const HEFEI_PALETTE: PaletteEntry[] = [
  {
    id: 'hf1',
    colourName: '中国红',
    name: { zh: '1号线', en: 'Line 1' },
    colour: '#e71f24',
    fg: '#fff',
  },
  {
    id: 'hf2',
    colourName: '群青蓝',
    name: { zh: '2号线', en: 'Line 2' },
    colour: '#0167b1',
    fg: '#fff',
  },
  {
    id: 'hf3',
    colourName: '翠微绿',
    name: { zh: '3号线', en: 'Line 3' },
    colour: '#00863e',
    fg: '#fff',
  },
  {
    id: 'hf4',
    colourName: '瑶光橙',
    name: { zh: '4号线', en: 'Line 4' },
    colour: '#f79826',
    fg: '#fff',
  },
  {
    id: 'hf5',
    colourName: '碧山青',
    name: { zh: '5号线', en: 'Line 5' },
    colour: '#c0d92e',
    fg: '#000',
  },
  {
    id: 'hf6',
    colourName: '丁香紫',
    name: { zh: '6号线', en: 'Line 6' },
    colour: '#c99fcd',
    fg: '#000',
  },
  {
    id: 'hf7',
    colourName: '银杏黄',
    name: { zh: '7号线', en: 'Line 7' },
    colour: '#f1cc40',
    fg: '#000',
  },
  {
    id: 'hf8',
    colourName: '湖波蓝',
    name: { zh: '8号线', en: 'Line 8' },
    colour: '#64aee3',
    fg: '#000',
  },
  {
    id: 'hfs1',
    colourName: '明茶褐',
    name: { zh: 'S1号线', en: 'Line S1' },
    colour: '#baa284',
    fg: '#fff',
  },
]

export const getPaletteEntry = (lineId: string) =>
  HEFEI_PALETTE.find((entry) => entry.id === lineId)

export const themeOf = (lineId: string): Theme => {
  const palette = getPaletteEntry(lineId)
  return palette
    ? [HEFEI_CITY_ID, palette.id, palette.colour, palette.fg]
    : [HEFEI_CITY_ID, lineId, '#888888', '#fff']
}
