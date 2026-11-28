/**
 * 物料预览区：按选择渲染当前物料，并把画布尺寸按容器宽度缩放显示。
 */

import { useEffect } from 'react'
import { CANVAS_LABELS, Material } from '@/materials'
import { ensureLedFont } from '@/materials/led/pixel-font'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'

export const Preview = () => {
  const project = useProjectStore((s) => s.project)
  const editor = useEditorStore()
  const { network, pov, canvas } = project
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const size = canvas.sizes[editor.activeCanvas]

  // 预载像素字体，避免首次切换到放送机时闪一下空白
  useEffect(() => {
    void ensureLedFont().catch(() => undefined)
  }, [])

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-muted/40 p-6">
      <div className="mb-3 flex items-baseline gap-2">
        <h1 className="text-sm font-semibold">{CANVAS_LABELS[editor.activeCanvas].zh}</h1>
        <span className="text-xs text-muted-foreground">
          {size.width} × {size.height}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto">
        <div className="material-canvas w-full max-w-[1200px] overflow-hidden rounded-lg border bg-white shadow-sm">
          {line ? (
            <Material
              kind={editor.activeCanvas}
              network={network}
              pov={pov}
              width={size.width}
              height={size.height}
              theme={line.theme}
              settings={{
                style: editor.destinationStyle,
                ledColour: editor.ledColour,
                scene: editor.scene,
                templates: editor.templates,
                language: canvas.language,
                showCode: false,
              }}
              freeze={editor.isExporting}
            />
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">线网为空</div>
          )}
        </div>
      </div>
    </main>
  )
}
