/**
 * 地图底图配置。
 *
 * 站点坐标统一存 WGS-84；高德底图是 GCJ-02，渲染前由 `coord.ts` 转换。
 * 瓦片只用于底图显示，不打包进构建产物；每层在 Leaflet 中自带版权说明。
 */

import { gcj02ToWgs84, wgs84ToGcj02, type LatLng } from './coord'

export type BasemapId = 'amap' | 'carto' | 'osm' | 'none'

export interface Basemap {
  id: BasemapId
  name: string
  /** 瓦片地址；无底图时为空。 */
  url?: string
  subdomains?: string
  attribution: string
  maxZoom: number
  /** 瓦片是否为 GCJ-02（高德）。 */
  gcj: boolean
}

export const BASEMAPS: Record<BasemapId, Basemap> = {
  amap: {
    id: 'amap',
    name: '高德',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: '1234',
    attribution: '© 高德地图',
    maxZoom: 18,
    gcj: true,
  },
  carto: {
    id: 'carto',
    name: '浅色',
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19,
    gcj: false,
  },
  osm: {
    id: 'osm',
    name: '标准',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    gcj: false,
  },
  none: {
    id: 'none',
    name: '无底图',
    attribution: '',
    maxZoom: 19,
    gcj: false,
  },
}

export const BASEMAP_IDS: BasemapId[] = ['amap', 'carto', 'osm', 'none']

/** 站点坐标（WGS-84）→ 当前底图的显示坐标。 */
export const toDisplay = (point: LatLng, basemap: BasemapId): LatLng =>
  BASEMAPS[basemap].gcj ? wgs84ToGcj02(point) : point

/** 当前底图的显示坐标 → 站点坐标（WGS-84）。 */
export const toWgs = (point: LatLng, basemap: BasemapId): LatLng =>
  BASEMAPS[basemap].gcj ? gcj02ToWgs84(point) : point
