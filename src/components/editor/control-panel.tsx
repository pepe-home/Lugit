/**
 * 选择面板：物料类型、当前线路与站点、行车方向、开门侧，以及各物料专属的可调项。
 *
 * 布局上把「决定物料内容」的设置（站点视角）与「决定呈现」的设置（样式）分成两组，
 * 前者用线路色标记，后者用中性色。
 */

import { ArrowLeft, ArrowRight, Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { composeJourney } from '@/core/announce'
import { downloadBlob } from '@/lib/export'
import { CANVAS_KINDS, CANVAS_LABELS } from '@/materials'
import { LED_COLOURS, type LedColour } from '@/materials/led/led'
import { ANNOUNCE_SCENES, type AnnounceScene, type SceneMode } from '@/core/announce'
import type { DestinationStyle } from '@/materials/destination'
import type { CanvasKind } from '@/core/model'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'
import { cn } from '@/lib/utils'

export const ControlPanel = () => {
  const { project, updatePov, updateCanvasSize } = useProjectStore()
  const editor = useEditorStore()
  const { network, pov } = project

  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const stationIndex = line.stations.indexOf(pov.currentStationId)

  const move = (delta: number) => {
    const next = line.stations[stationIndex + delta]
    if (next) updatePov({ currentStationId: next })
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col gap-5 overflow-y-auto border-l bg-muted/20 p-4">
      <Section title="物料">
        <div className="grid grid-cols-2 gap-2">
          {CANVAS_KINDS.map((kind) => (
            <button
              key={kind}
              onClick={() => editor.setActiveCanvas(kind)}
              className={cn(
                'rounded-md border px-3 py-2 text-left text-sm transition-colors',
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
          size={project.canvas.sizes[editor.activeCanvas]}
          onChange={(size) => updateCanvasSize(editor.activeCanvas, size)}
        />
      </Section>

      <Section title="当前位置" accent={line.theme[2]}>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">线路</span>
          <select
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            value={pov.lineId}
            onChange={(e) => {
              const nextLine = network.lines.find((l) => l.id === e.target.value)
              if (!nextLine) return
              // 换线时若当前站在新线上则保留，否则跳到新线的第一个站
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
        </label>

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
            { value: 'l', label: '向左' },
            { value: 'r', label: '向右' },
          ]}
          value={pov.direction}
          onChange={(direction) =>
            updatePov({ direction: direction as 'l' | 'r', trainTerminalId: undefined })
          }
        />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">开门侧</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => updatePov({ doorSide: pov.doorSide === 'left' ? 'right' : 'left' })}
          >
            {pov.doorSide === 'left' ? '左侧' : '右侧'}
          </Button>
        </div>
      </Section>

      {(editor.activeCanvas === 'destination' || editor.activeCanvas === 'announce') && (
        <Section title="LED 屏">
          <div className="flex gap-2">
            {(Object.keys(LED_COLOURS) as LedColour[]).map((colour) => (
              <button
                key={colour}
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
      )}

      {editor.activeCanvas === 'destination' && (
        <Section title="站牌样式">
          <Segmented
            options={[
              { value: 'led', label: 'LED 屏' },
              { value: 'print', label: '灯箱 / 印刷' },
            ]}
            value={editor.destinationStyle}
            onChange={(value) => editor.setDestinationStyle(value as DestinationStyle)}
          />
        </Section>
      )}

      {editor.activeCanvas === 'announce' && <AnnounceControls />}
    </aside>
  )
}

const NL = String.fromCharCode(10)

const AnnounceControls = () => {
  const editor = useEditorStore()
  const project = useProjectStore((s) => s.project)
  const [exporting, setExporting] = useState(false)

  // 按行车方向把所有站点的播报文案导出成文本，便于交给 TTS 批量合成
  const handleExportScripts = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const items = composeJourney(project.network, project.pov, editor.scene, editor.templates)
      const sceneName: Record<string, string> = {
        departure: '离站',
        departureTerminal: '离站·下一站为终点站',
        arrival: '到站',
        arrivalTerminal: '到站·终点站',
      }
      const lineName = project.network.lines.find((l) => l.id === project.pov.lineId)?.name.zh ?? ''
      const direction = project.pov.direction === 'l' ? '向左' : '向右'
      const doorSide = project.pov.doorSide === 'left' ? '左侧' : '右侧'
      const header = [
        `# ${lineName} 播报文本`,
        `# 方向：${direction}，开门侧：${doorSide}`,
        '',
      ].join(NL)
      const body = items
        .map(
          (item, i) =>
            `${String(i + 1).padStart(2, '0')} [${sceneName[item.scene]}]${NL}  ${item.texts.zh ?? ''}${NL}  ${item.texts.en ?? ''}`,
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

  const sceneOptions: { value: string; label: string }[] = [
    { value: 'auto', label: '自动' },
    ...ANNOUNCE_SCENES.map((scene) => ({ value: scene, label: sceneLabel(scene) })),
  ]

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
        <label className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">显示英文</span>
          <Switch
            checked={project.canvas.language !== 'zh'}
            onCheckedChange={(checked) =>
              useProjectStore
                .getState()
                .updateLanguage(
                  checked
                    ? project.canvas.language === 'en'
                      ? 'both'
                      : project.canvas.language
                    : 'zh',
                )
            }
            aria-label="显示英文"
          />
        </label>
      </Section>

      <Section title="播报模板">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          占位符：{'{station}'} {'{next}'} {'{terminal}'} {'{line}'} {'{doors}'} {'{interchange}'}
        </p>
        {ANNOUNCE_SCENES.map((scene) => (
          <div key={scene} className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              {sceneLabel(scene)}
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
        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="self-start" onClick={editor.resetTemplates}>
            <RotateCcw />
            恢复默认模板
          </Button>
          <Button variant="outline" size="sm" className="self-start" onClick={handleExportScripts}>
            <Download />
            导出全线播报
          </Button>
        </div>
      </Section>
    </>
  )
}

const sceneLabel = (scene: AnnounceScene | CanvasKind) =>
  ({
    departure: '离站',
    departureTerminal: '离站 · 下一站为终点站',
    arrival: '到站',
    arrivalTerminal: '到站 · 终点站',
  })[scene as AnnounceScene] ?? scene

interface SectionProps {
  title: string
  accent?: string
  children: React.ReactNode
}

const Section = ({ title, accent, children }: SectionProps) => (
  <section className="flex flex-col gap-2">
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {accent && (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}
      {title}
    </h2>
    {children}
  </section>
)

interface SegmentedProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

const Segmented = ({ options, value, onChange }: SegmentedProps) => (
  <div className="flex rounded-md border bg-background p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          'flex-1 rounded px-2 py-1 text-xs transition-colors',
          value === o.value ? 'bg-secondary font-medium' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
)

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
    <span className="col-span-3 text-[10px] opacity-60">{`${CANVAS_LABELS[kind].zh}画布尺寸（单位 px，导出按 2 倍分辨率）`}</span>
  </div>
)
