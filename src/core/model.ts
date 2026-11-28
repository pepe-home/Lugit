/**
 * metro 的线网模型。
 *
 * 数据可迁移自 rmg 的 RMGParam：多语言站名用 `localisedName.zh / en`，换乘用 `transfer.groups`，
 * 行车方向用 `parents / children` 组成的邻接表。导入 rmg 项目时由 `import-rmg.ts` 转换。
 *
 * 刻意不沿用的部分：不设 `linestart / lineend` 虚拟站，终点由路线决定；
 * 不设与具体风格绑定的字段（站台门盖板样式、车站编号间距等）。
 */

import type { MonoColour, Theme } from '@/data/palette'

export type { MonoColour, Theme }

/** 双语文本。英文可用 `\` 手动断行，与 rmg 一致。 */
export interface LocalisedText {
  zh?: string
  en?: string
}

/** 地理坐标，统一使用 WGS-84；高德底图显示前再转 GCJ-02。 */
export interface GeoPoint {
  lat: number
  lng: number
}

export type TransferKind = 'in-station' | 'out-of-station' | 'out-of-system'

export interface InterchangeLine {
  /** 换乘线路的线色，用于徽标。缺省时使用线路自己的颜色。 */
  theme?: Theme
  /** 线路名称，例如「2号线」/「Line 2」。 */
  name: LocalisedText
}

export interface Transfer {
  kind: TransferKind
  paidArea: boolean
  lines: InterchangeLine[]
}

/** 列车种类，决定站点是否停靠。 */
export type ServiceKind = 'local' | 'express' | 'direct'

export interface Station {
  id: string
  name: LocalisedText
  secondaryName?: LocalisedText
  /** 车站编号，例如「011」。 */
  code?: string
  /** 站点位置；线网地图与拖放绘制使用。 */
  geo?: GeoPoint
  transfers: Transfer[]
  /** 停靠本站的车次，空数组表示暂缓开通。 */
  services: ServiceKind[]
  noService?: 'under-construction' | 'suspended'
}

export interface Line {
  id: string
  name: LocalisedText
  theme: Theme
  /** 主干站点 id，按行车方向排列（左 → 右）。 */
  stations: string[]
  /** 支线站点，从主干上的站点分出；支线首站必须在 `stations` 内。 */
  branches?: string[][]
}

/** 有向连接，方向与 `Line.stations` 的顺序一致。 */
export interface Segment {
  from: string
  to: string
}

/** 物料类型：站名牌、线路牌、报幕机。 */
export type CanvasKind = 'plate' | 'board' | 'announce'

/** 制作物料时站在哪一站、朝哪个方向。 */
export interface StationPov {
  lineId: string
  currentStationId: string
  /** 行车方向：`r` 沿 `Line.stations` 顺序前进，`l` 逆序。 */
  direction: 'l' | 'r'
  /** 本次列车终点站；缺省取该方向上线路的终点站。 */
  trainTerminalId?: string
  /** 开门方向。 */
  doorSide: 'left' | 'right'
  platformNumber?: string
}

export interface CanvasSettings {
  sizes: Record<CanvasKind, { width: number; height: number }>
  language: 'both' | 'zh' | 'en'
}

export interface Network {
  id: string
  name: string
  lines: Line[]
  stations: Record<string, Station>
}

export const CURRENT_PROJECT_VERSION = 3

export interface Project {
  version: number
  name: string
  network: Network
  pov: StationPov
  canvas: CanvasSettings
}
