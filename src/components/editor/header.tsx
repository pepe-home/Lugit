/**
 * 顶部栏：品牌、当前线路与站点、全部物料一键导出。
 */

import { Download, ImageDown, FileCode2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CANVAS_KINDS } from '@/materials'
import { useProjectStore } from '@/state/project'
import { useEditorStore } from '@/state/editor'
import { exportPng, exportSvg } from '@/lib/export'

export const Header = () => {
  const project = useProjectStore((s) => s.project)
  const setIsExporting = useEditorStore((s) => s.setIsExporting)
  const activeCanvas = useEditorStore((s) => s.activeCanvas)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  const line = project.network.lines.find((l) => l.id === project.pov.lineId)
  const station = project.network.stations[project.pov.currentStationId]

  const handleExport = async (format: 'png' | 'svg') => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      setIsExporting(true)
      // 等待一帧，让动画元素切到静态帧
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      for (const kind of CANVAS_KINDS) {
        const element = document.querySelector<SVGSVGElement>(`#metro-${kind}`)
        if (!element) continue
        const filename = `${project.name}-${kind}`
        if (format === 'png') await exportPng(element, filename)
        else exportSvg(element, filename)
      }
    } catch (err) {
      console.error('导出失败', err)
    } finally {
      setIsExporting(false)
      busyRef.current = false
      setBusy(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-7 w-7" />
        <div className="leading-tight">
          <div className="text-sm font-semibold">metro</div>
          <div className="text-[11px] text-muted-foreground">线网与车站物料制作</div>
        </div>
      </div>

      <div className="ml-2 flex items-center gap-2 text-sm">
        {line && (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: line.theme[2], color: line.theme[3] }}
          >
            {line.name.zh}
          </span>
        )}
        <span className="font-medium">{station?.name.zh}</span>
        <span className="text-muted-foreground">{station?.name.en}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          共 {CANVAS_KINDS.length} 份物料
        </span>
        <Button variant="outline" size="sm" onClick={() => handleExport('svg')} disabled={busy}>
          <FileCode2 />
          SVG
        </Button>
        <Button size="sm" onClick={() => handleExport('png')} disabled={busy}>
          {formatIcon(activeCanvas)}
          {busy ? '导出中…' : '导出 PNG'}
        </Button>
      </div>
    </header>
  )
}

const formatIcon = (kind: string) => (kind === 'railmap' ? <ImageDown /> : <Download />)
