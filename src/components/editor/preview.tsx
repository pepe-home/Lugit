/**
 * 预览区：线网工作区显示地图编辑器或单线示意，车站工作区显示当前物料；
 * 物料画布按容器宽度等比缩放，标题旁标注实际导出尺寸。
 */

import { Suspense, lazy, useEffect } from 'react'
import { CANVAS_LABELS, Material, boardGeometry } from '@/materials'
import { LineMap } from '@/materials/line-map'
import { ensureLedFont } from '@/materials/led/pixel-font'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'

// 地图与 Leaflet 只在进入线网工作区时加载
const NetworkMap = lazy(() =>
  import('./network-map').then((module) => ({ default: module.NetworkMap })),
)

const LINE_MAP_SIZE = { width: 2020, height: 420 }

/** 线路示意按站数加宽，避免站名互相挤压。 */
const lineMapWidth = (stations: number) => Math.max(LINE_MAP_SIZE.width, stations * 112)

export const Preview = () => {
  const project = useProjectStore((s) => s.project)
  const editor = useEditorStore()
  const { network, pov, canvas } = project
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const settings = canvas.sizes[editor.activeCanvas]
  const schematicWidth = lineMapWidth(line?.stations.length ?? 0)

  // 预载像素字体，避免首次切换到报幕机时闪一下空白
  useEffect(() => {
    void ensureLedFont().catch(() => undefined)
  }, [])

  const size =
    editor.workspace === 'network'
      ? { width: schematicWidth, height: LINE_MAP_SIZE.height }
      : editor.activeCanvas === 'board'
        ? {
            width: boardGeometry(network, pov, settings.width, settings.height, canvas.language)
              .width,
            height: settings.height,
          }
        : settings

  const title =
    editor.workspace === 'network'
      ? editor.networkView === 'map'
        ? '线网地图'
        : `${line?.name.zh ?? ''} 线路示意`
      : CANVAS_LABELS[editor.activeCanvas].zh

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-muted/40">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-4">
        <h1 className="text-sm font-semibold">{title}</h1>
        {editor.workspace === 'network' && editor.networkView === 'map' ? (
          <span className="text-xs text-muted-foreground">
            {network.lines.length} 条线 · {Object.keys(network.stations).length} 站
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {size.width} × {size.height}
          </span>
        )}

        {editor.workspace === 'network' && (
          <div className="ml-auto flex rounded-md border bg-background p-0.5">
            {(
              [
                { value: 'map', label: '地图' },
                { value: 'schematic', label: '示意' },
              ] as const
            ).map((view) => (
              <button
                key={view.value}
                type="button"
                onClick={() => editor.setNetworkView(view.value)}
                className={
                  editor.networkView === view.value
                    ? 'rounded bg-secondary px-2.5 py-1 text-xs font-medium'
                    : 'rounded px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent'
                }
              >
                {view.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {editor.workspace === 'network' && editor.networkView === 'map' ? (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}>
            <NetworkMap />
          </Suspense>
        ) : (
          <div className="flex h-full items-start justify-center overflow-auto p-6">
            <div className="material-canvas w-full max-w-[1200px] overflow-hidden rounded-lg border bg-white shadow-sm">
              {!line ? (
                <div className="p-12 text-center text-sm text-muted-foreground">线网为空</div>
              ) : editor.workspace === 'network' ? (
                <LineMap
                  network={network}
                  pov={pov}
                  width={schematicWidth}
                  height={LINE_MAP_SIZE.height}
                  theme={line.theme}
                />
              ) : (
                <Material
                  kind={editor.activeCanvas}
                  network={network}
                  pov={pov}
                  width={settings.width}
                  height={settings.height}
                  theme={line.theme}
                  settings={{
                    ledColour: editor.ledColour,
                    scene: editor.scene,
                    templates: editor.templates,
                    language: canvas.language,
                  }}
                  freeze={editor.isExporting}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
