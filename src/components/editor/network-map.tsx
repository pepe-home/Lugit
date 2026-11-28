/**
 * 线网地图编辑器（Leaflet）。
 *
 * - 所有线路按官方线色画在底图上，换乘站用双环标记；
 * - 拖动站点改坐标（落到另一站附近可并入，成为换乘站）；
 * - 「延伸线路」模式下点击地图，在当前站之后追加站点；
 * - 底图可选高德（GCJ-02）/ CARTO / OSM / 无底图，坐标在显示与存储之间自动换算。
 *
 * 地图只负责线网几何；物料仍由站点顺序派生。
 */

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize, PencilLine } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { linesOfStation } from '@/core/network'
import { BASEMAPS, BASEMAP_IDS, toDisplay, toWgs } from '@/lib/basemap'
import { gcj02ToWgs84, wgs84ToGcj02 } from '@/lib/coord'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'

/** 拖拽落点距另一座站多近时提示合并（米）。 */
const MERGE_DISTANCE = 120

export const NetworkMap = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const datumRef = useRef<'wgs84' | 'gcj02' | null>(null)

  const project = useProjectStore((s) => s.project)
  const basemap = useEditorStore((s) => s.basemap)
  const mapMode = useEditorStore((s) => s.mapMode)
  const zoom = useEditorStore((s) => s.viewZoom)
  const currentLine =
    project.network.lines.find((l) => l.id === project.pov.lineId) ?? project.network.lines[0]
  const currentStation = project.network.stations[project.pov.currentStationId]

  // 初始化地图：只做一次；尺寸变化时重算
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      minZoom: 8,
      maxZoom: 19,
    })
    mapRef.current = map
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)

    const st = useEditorStore.getState()
    const center = toDisplay(st.viewCenter, st.basemap)
    map.setView([center.lat, center.lng], st.viewZoom)

    const fit = () => {
      const p = useProjectStore.getState().project
      const bm = useEditorStore.getState().basemap
      const points = Object.values(p.network.stations).flatMap((station) =>
        station.geo ? [[toDisplay(station.geo, bm).lat, toDisplay(station.geo, bm).lng]] : [],
      ) as [number, number][]
      if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36] })
    }

    if (!st.viewInitialised) {
      requestAnimationFrame(() => {
        if (!mapRef.current) return
        map.invalidateSize()
        fit()
        useEditorStore.getState().markViewInitialised()
      })
    }

    map.on('moveend', () => {
      const c = map.getCenter()
      const bm = useEditorStore.getState().basemap
      useEditorStore.getState().setView(toWgs({ lat: c.lat, lng: c.lng }, bm), map.getZoom())
    })

    map.on('click', (e: L.LeafletMouseEvent) => {
      const state = useEditorStore.getState()
      if (state.mapMode !== 'draw') return
      const wgs = toWgs({ lat: e.latlng.lat, lng: e.latlng.lng }, state.basemap)
      const p = useProjectStore.getState().project
      useProjectStore.getState().addStation(p.pov.lineId, p.pov.currentStationId, wgs)
    })

    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      tileRef.current = null
      datumRef.current = null
    }
  }, [])

  // 底图切换：换瓦片，并在坐标系变化时保持视野中心不变
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const conf = BASEMAPS[basemap]

    if (tileRef.current) {
      map.removeLayer(tileRef.current)
      tileRef.current = null
    }

    if (datumRef.current && datumRef.current !== (conf.gcj ? 'gcj02' : 'wgs84')) {
      const center = map.getCenter()
      const wgs =
        datumRef.current === 'gcj02'
          ? gcj02ToWgs84({ lat: center.lat, lng: center.lng })
          : { lat: center.lat, lng: center.lng }
      const next = conf.gcj ? wgs84ToGcj02(wgs) : wgs
      map.setView([next.lat, next.lng], map.getZoom(), { animate: false })
    }
    datumRef.current = conf.gcj ? 'gcj02' : 'wgs84'

    if (conf.url) {
      tileRef.current = L.tileLayer(conf.url, {
        subdomains: conf.subdomains ?? 'abc',
        attribution: conf.attribution,
        maxZoom: conf.maxZoom,
        minZoom: 8,
      }).addTo(map)
    }
  }, [basemap])

  // 线网图层：线路折线 + 站点标记
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const { network, pov } = project
    const activeLine = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
    const group = L.layerGroup().addTo(map)

    const drawPath = (ids: string[], lineId: string) => {
      const line = network.lines.find((l) => l.id === lineId)
      if (!line) return
      const coords = ids.flatMap((id) => {
        const geo = network.stations[id]?.geo
        if (!geo) return []
        const p = toDisplay(geo, basemap)
        return [[p.lat, p.lng] as [number, number]]
      })
      if (coords.length < 2) return
      L.polyline(coords, {
        color: line.theme[2],
        weight: line.id === activeLine?.id ? 6 : 4,
        opacity: line.id === activeLine?.id ? 1 : 0.65,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group)
    }

    for (const line of network.lines) {
      drawPath(line.stations, line.id)
      for (const branch of line.branches ?? []) drawPath(branch, line.id)
    }

    const referenced = new Set(
      network.lines.flatMap((l) => [...l.stations, ...(l.branches ?? []).flat()]),
    )
    for (const id of referenced) {
      const station = network.stations[id]
      if (!station?.geo) continue
      const stationLines = linesOfStation(network, id)
      const current = id === pov.currentStationId
      const interchange = stationLines.length > 1
      const ownLine =
        stationLines.find((lineId) => lineId === activeLine?.id) ??
        stationLines[0] ??
        activeLine?.id
      const colour = network.lines.find((l) => l.id === ownLine)?.theme[2] ?? '#333333'
      const display = toDisplay(station.geo, basemap)

      const marker = L.marker([display.lat, display.lng], {
        icon: L.divIcon({
          className: cn(
            'metro-map-station',
            interchange && 'is-interchange',
            current && 'is-current',
          ),
          html: `<span style="--dot:${colour}"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        draggable: true,
        keyboard: false,
        riseOnHover: true,
      })

      marker.on('click', () => {
        const p = useProjectStore.getState().project
        const onCurrent = p.network.lines.find((l) => l.id === p.pov.lineId)?.stations.includes(id)
        useProjectStore.getState().updatePov({
          lineId: onCurrent ? p.pov.lineId : (stationLines[0] ?? p.pov.lineId),
          currentStationId: id,
          trainTerminalId: undefined,
        })
      })

      marker.on('dragend', () => {
        const p = useProjectStore.getState().project
        const bm = useEditorStore.getState().basemap
        const pos = marker.getLatLng()

        let nearest: { id: string; distance: number } | null = null
        for (const [otherId, other] of Object.entries(p.network.stations)) {
          if (otherId === id || !other.geo) continue
          const d = toDisplay(other.geo, bm)
          const distance = map.distance([pos.lat, pos.lng], [d.lat, d.lng])
          if (!nearest || distance < nearest.distance) nearest = { id: otherId, distance }
        }

        const shareLine =
          nearest &&
          linesOfStation(p.network, id).some((lineId) =>
            linesOfStation(p.network, nearest!.id).includes(lineId),
          )

        if (nearest && !shareLine && nearest.distance <= MERGE_DISTANCE) {
          const a = p.network.stations[id]?.name.zh ?? id
          const b = p.network.stations[nearest.id]?.name.zh ?? nearest.id
          if (window.confirm(`把「${a}」并入「${b}」，设为同一座换乘站？`)) {
            useProjectStore.getState().mergeStations(id, nearest.id)
            return
          }
        }

        useProjectStore.getState().moveStationTo(id, toWgs({ lat: pos.lat, lng: pos.lng }, bm))
      })

      marker.bindTooltip(station.name.zh ?? '', {
        permanent:
          interchange || current || (zoom >= 12 && stationLines.includes(activeLine?.id ?? '')),
        direction: 'right',
        offset: [9, 0],
        className: 'metro-map-label',
      })
      marker.addTo(group)
    }

    return () => {
      group.remove()
    }
  }, [project, basemap, zoom])

  const fitToNetwork = () => {
    const map = mapRef.current
    if (!map) return
    const points = Object.values(project.network.stations).flatMap((station) => {
      if (!station.geo) return []
      const p = toDisplay(station.geo, basemap)
      return [[p.lat, p.lng] as [number, number]]
    })
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36] })
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={cn('h-full w-full', mapMode === 'draw' && 'cursor-crosshair')}
      />

      <div className="pointer-events-none absolute left-3 top-3 z-[900] flex items-center gap-2 rounded-md border bg-background/90 px-2 py-1 text-xs shadow-sm">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: currentLine?.theme[2] }}
        />
        <span className="font-medium">{currentLine?.name.zh}</span>
        <span className="text-muted-foreground">{currentStation?.name.zh}</span>
      </div>

      <div className="absolute right-3 top-3 z-[900] flex items-center gap-1.5 rounded-md border bg-background/95 p-1.5 shadow-sm">
        <select
          className="rounded-md border bg-background px-1.5 py-1 text-xs"
          value={basemap}
          onChange={(e) => useEditorStore.getState().setBasemap(e.target.value as typeof basemap)}
          aria-label="底图"
        >
          {BASEMAP_IDS.map((id) => (
            <option key={id} value={id}>
              {BASEMAPS[id].name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={mapMode === 'draw' ? 'default' : 'outline'}
          onClick={() =>
            useEditorStore.getState().setMapMode(mapMode === 'draw' ? 'select' : 'draw')
          }
        >
          <PencilLine />
          延伸线路
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          onClick={fitToNetwork}
          aria-label="适应线网"
        >
          <Maximize />
        </Button>
      </div>
    </div>
  )
}
