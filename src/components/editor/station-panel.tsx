/**
 * 车站工作区：选定一条线与一座车站，制作该站的三种物料。
 *
 * 上半部分决定「站在哪、朝哪开」（物料内容），下半部分决定「做哪件、怎么呈现」。
 */

import { ArrowLeft, ArrowRight, Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { CANVAS_KINDS, CANVAS_LABELS } from '@/materials'
import { LED_COLOURS, type LedColour } from '@/materials/led/led'
import {
  ANNOUNCE_SCENES,
  composeJourney,
  type AnnounceScene,
  type SceneMode,
} from '@/core/announce'
import type { CanvasKind } from '@/core/model'
import { downloadBlob } from '@/lib/export'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'
import { cn } from '@/lib/utils'
import { Section, Segmented } from './panel-ui'

const NL = String.fromCharCode(10)

const SCENE_LABELS: Record<AnnounceScene, string> = {
  departure: '离站',
  departureTerminal: '离站 · 下一站为终点站',
  arrival: '到站',
  arrivalTerminal: '到站 · 终点站',
}

export const StationPanel = () => {
  const { project, updatePov, updateCanvasSize, updateLanguage } = useProjectStore()
  const editor = useEditorStore()
  const { network, pov, canvas } = project

  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const stationIndex = line.stations.indexOf(pov.currentStationId)
  const first = network.stations[line.stations[0]]
  const last = network.stations[line.stations[line.stations.length - 1]]

  const move = (delta: number) => {
    const next = line.stations[stationIndex + delta]
    if (next) updatePov({ currentStationId: next, trainTerminalId: undefined })
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title="当前位置" accent={line.theme[2]}>
        <select
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          value={pov.lineId}
          onChange={(e) => {
            const nextLine = network.lines.find((l) => l.id === e.target.value)
            if (!nextLine) return
            const keep = nextLine.stations.includes(pov.currentStationId)
            updatePov({
              lineId: nextLine.id,
              currentStationId: keep ? pov.currentStationId : nextLine.stations[0],
              trainTerminalId: undefined,
            })
          }}
        >
          {network.lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name.zh} · {l.name.en}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => move(-1)}
            aria-label="上一站"
          >
            <ArrowLeft />
          </Button>
          <select
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
            value={pov.currentStationId}
            onChange={(e) =>
              updatePov({ currentStationId: e.target.value, trainTerminalId: undefined })
            }
          >
            {line.stations.map((id, i) => (
              <option key={id} value={id}>
                {`${String(i + 1).padStart(2, '0')} ${network.stations[id]?.name.zh ?? id}`}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => move(1)}
            aria-label="下一站"
          >
            <ArrowRight />
          </Button>
        </div>

        <Segmented
          options={[
            { value: 'l', label: `← ${first?.name.zh ?? ''}` },
            { value: 'r', label: `${last?.name.zh ?? ''} →` },
          ]}
          value={pov.direction}
          onChange={(direction) =>
            updatePov({ direction: direction as 'l' | 'r', trainTerminalId: undefined })
          }
        />

        <Segmented
          options={[
            { value: 'left', label: '左侧开门' },
            { value: 'right', label: '右侧开门' },
          ]}
          value={pov.doorSide}
          onChange={(doorSide) => updatePov({ doorSide: doorSide as 'left' | 'right' })}
        />
      </Section>

      <Section title="物料">
        <div className="grid grid-cols-3 gap-1.5">
          {CANVAS_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => editor.setActiveCanvas(kind)}
              className={cn(
                'rounded-md border px-2 py-2 text-xs transition-colors',
                editor.activeCanvas === kind
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'bg-background hover:bg-accent',
              )}
            >
              {CANVAS_LABELS[kind].zh}
            </button>
          ))}
        </div>
        <SizeControl
          kind={editor.activeCanvas}
          size={canvas.sizes[editor.activeCanvas]}
          onChange={(size) => updateCanvasSize(editor.activeCanvas, size)}
        />
      </Section>

      <Section title="语言">
        <Segmented
          options={[
            { value: 'zh', label: '中文' },
            { value: 'both', label: '中英' },
            { value: 'en', label: 'English' },
          ]}
          value={canvas.language}
          onChange={(value) => updateLanguage(value as typeof canvas.language)}
        />
      </Section>

      {editor.activeCanvas === 'announce' && <AnnounceControls />}
    </div>
  )
}

const AnnounceControls = () => {
  const editor = useEditorStore()
  const project = useProjectStore((s) => s.project)
  const [exporting, setExporting] = useState(false)

  const sceneOptions: { value: SceneMode; label: string }[] = [
    { value: 'auto', label: '自动（按站点与终点站推导）' },
    ...ANNOUNCE_SCENES.map((scene) => ({ value: scene, label: SCENE_LABELS[scene] })),
  ]

  // 按行车方向把所有站点的播报文案导出成文本，便于交给 TTS 批量合成
  const handleExportScripts = () => {
    if (exporting) return
    setExporting(true)
    try {
      const items = composeJourney(project.network, project.pov, editor.scene, editor.templates)
      const lineName = project.network.lines.find((l) => l.id === project.pov.lineId)?.name.zh ?? ''
      const header = [
        `# ${lineName} 播报文本`,
        `# 方向：${project.pov.direction === 'l' ? '左行' : '右行'}，开门侧：${project.pov.doorSide === 'left' ? '左侧' : '右侧'}`,
        '',
      ].join(NL)
      const body = items
        .map(
          (item, i) =>
            `${String(i + 1).padStart(2, '0')} [${SCENE_LABELS[item.scene]}]${NL}  ${item.texts.zh ?? ''}${NL}  ${item.texts.en ?? ''}`,
        )
        .join(NL)
      downloadBlob(
        new Blob([header + body + NL], { type: 'text/plain' }),
        `${project.name}-announcement.txt`,
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Section title="场景">
        <select
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          value={editor.scene}
          onChange={(e) => editor.setScene(e.target.value as SceneMode)}
        >
          {sceneOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="点阵颜色">
        <div className="flex gap-2">
          {(Object.keys(LED_COLOURS) as LedColour[]).map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => editor.setLedColour(colour)}
              className={cn(
                'flex h-9 flex-1 items-center justify-center rounded-md border text-[11px] font-medium',
                editor.ledColour === colour ? 'ring-2 ring-offset-1' : '',
              )}
              style={{ backgroundColor: LED_COLOURS[colour].hex, color: '#111' }}
            >
              {LED_COLOURS[colour].name.zh}
            </button>
          ))}
        </div>
      </Section>

      <Section title="播报模板">
        <details className="group rounded-md border bg-background">
          <summary className="cursor-pointer px-2 py-1.5 text-xs text-muted-foreground">
            场景文案（占位符 {'{station}'} {'{next}'} {'{terminal}'} {'{line}'} {'{doors}'}{' '}
            {'{interchange}'}）
          </summary>
          <div className="flex flex-col gap-2 p-2 pt-0">
            {ANNOUNCE_SCENES.map((scene) => (
              <div key={scene} className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium">
                  {SCENE_LABELS[scene]}
                  {editor.scene === scene && <Badge variant="secondary">预览中</Badge>}
                </div>
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-md border bg-background px-2 py-1 text-xs"
                  value={editor.templates[scene].zh ?? ''}
                  onChange={(e) => editor.updateTemplate(scene, { zh: e.target.value })}
                />
                <textarea
                  rows={2}
                  className="w-full resize-none rounded-md border bg-background px-2 py-1 text-xs"
                  value={editor.templates[scene].en ?? ''}
                  onChange={(e) => editor.updateTemplate(scene, { en: e.target.value })}
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={editor.resetTemplates}
            >
              <RotateCcw />
              恢复默认模板
            </Button>
          </div>
        </details>
        <Button variant="outline" size="sm" className="self-start" onClick={handleExportScripts}>
          <Download />
          导出整线播报文本
        </Button>
      </Section>
    </>
  )
}

interface SizeControlProps {
  kind: CanvasKind
  size: { width: number; height: number }
  onChange: (size: { width: number; height: number }) => void
}

const SizeControl = ({ kind, size, onChange }: SizeControlProps) => (
  <div className="mt-1 grid grid-cols-[auto_1fr_3.5rem] items-center gap-2 text-xs text-muted-foreground">
    <span>高度</span>
    <Slider
      min={120}
      max={600}
      step={10}
      value={[size.height]}
      onValueChange={([height]) => onChange({ ...size, height })}
      aria-label="画布高度"
    />
    <span className="text-right tabular-nums">{size.height}</span>
    <span>宽度</span>
    <Slider
      min={600}
      max={3000}
      step={20}
      value={[size.width]}
      onValueChange={([width]) => onChange({ ...size, width })}
      aria-label="画布宽度"
    />
    <span className="text-right tabular-nums">{size.width}</span>
    <span className="col-span-3 text-[10px] opacity-60">
      {kind === 'board'
        ? '宽度为下限，站点多时线路牌自动加宽；导出按 2 倍分辨率'
        : '画布尺寸（单位 px），导出按 2 倍分辨率'}
    </span>
  </div>
)
