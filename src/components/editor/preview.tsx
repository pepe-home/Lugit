/**
 * 预览区：线网工作区显示线路示意，车站工作区显示当前物料；
 * 画布按容器宽度等比缩放，标题旁标注实际导出尺寸。
 */

import { useEffect } from 'react'
import { CANVAS_LABELS, Material, boardGeometry } from '@/materials'
import { LineMap } from '@/materials/line-map'
import { ensureLedFont } from '@/materials/led/pixel-font'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'

const LINE_MAP_SIZE = { width: 2020, height: 420 }

/** 线路示意按站数加宽，避免站名互相挤压。 */
const lineMapWidth = (stations: number) => Math.max(LINE_MAP_SIZE.width, stations * 112)

export const Preview = () => {
  const project = useProjectStore((s) => s.project)
  const editor = useEditorStore()
  const { network, pov, canvas } = project
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const settings = canvas.sizes[editor.activeCanvas]

  // 预载像素字体，避免首次切换到报幕机时闪一下空白
  useEffect(() => {
    void ensureLedFont().catch(() => undefined)
  }, [])

  const size =
    editor.workspace === 'network'
      ? { width: lineMapWidth(line?.stations.length ?? 0), height: LINE_MAP_SIZE.height }
      : editor.activeCanvas === 'board'
        ? {
            width: boardGeometry(network, pov, settings.width, settings.height, canvas.language)
              .width,
            height: settings.height,
          }
        : settings

  const title =
    editor.workspace === 'network'
      ? `${line?.name.zh ?? ''} 线路示意`
      : CANVAS_LABELS[editor.activeCanvas].zh

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-muted/40 p-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h1 className="text-sm font-semibold">{title}</h1>
        <span className="text-xs text-muted-foreground">
          {size.width} × {size.height}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto">
        <div className="material-canvas w-full max-w-[1200px] overflow-hidden rounded-lg border bg-white shadow-sm">
          {!line ? (
            <div className="p-12 text-center text-sm text-muted-foreground">线网为空</div>
          ) : editor.workspace === 'network' ? (
            <LineMap
              network={network}
              pov={pov}
              width={size.width}
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
    </main>
  )
}
