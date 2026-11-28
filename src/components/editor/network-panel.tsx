/**
 * 线网工作区：选择线路、改线名与线色、增删站点与调整站序。
 *
 * 编辑结果即时写入项目并刷新右侧预览（线路示意）；换乘关系由核心层重算。
 */

import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HEFEI_PALETTE } from '@/data/palette'
import { useProjectStore } from '@/state/project'
import { cn } from '@/lib/utils'
import { Field, Section, TextInput } from './panel-ui'

export const NetworkPanel = () => {
  const {
    project,
    updatePov,
    updateLineName,
    updateLineTheme,
    addStation,
    moveStation,
    removeStation,
    renameStation,
    resetNetwork,
  } = useProjectStore()
  const { network, pov } = project
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const station = network.stations[pov.currentStationId]
  const canRemove = line.stations.length > 2

  const selectLine = (lineId: string) => {
    const next = network.lines.find((l) => l.id === lineId)
    if (!next) return
    updatePov({
      lineId: next.id,
      currentStationId: next.stations.includes(pov.currentStationId)
        ? pov.currentStationId
        : next.stations[0],
      trainTerminalId: undefined,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="线路"
        action={<span className="text-xs text-muted-foreground">{network.lines.length} 条</span>}
      >
        <div className="grid grid-cols-3 gap-1.5">
          {network.lines.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => selectLine(l.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                l.id === line.id
                  ? 'border-foreground/30 bg-accent font-medium'
                  : 'bg-background hover:bg-accent',
              )}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: l.theme[2] }}
              />
              <span className="truncate">{l.name.zh}</span>
            </button>
          ))}
        </div>

        <div className="mt-1 flex flex-col gap-1.5">
          <Field label="中文名">
            <TextInput
              value={line.name.zh ?? ''}
              onChange={(e) => updateLineName(line.id, { ...line.name, zh: e.target.value })}
            />
          </Field>
          <Field label="英文名">
            <TextInput
              value={line.name.en ?? ''}
              onChange={(e) => updateLineName(line.id, { ...line.name, en: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HEFEI_PALETTE.map((entry) => (
            <button
              key={entry.id}
              type="button"
              title={entry.colourName}
              aria-label={entry.colourName}
              onClick={() =>
                updateLineTheme(line.id, [line.theme[0], entry.id, entry.colour, entry.fg])
              }
              className={cn(
                'h-6 w-6 rounded-full border transition-transform',
                line.theme[2].toLowerCase() === entry.colour.toLowerCase()
                  ? 'ring-2 ring-foreground/40 ring-offset-2 ring-offset-background'
                  : 'hover:scale-110',
              )}
              style={{ backgroundColor: entry.colour }}
            />
          ))}
        </div>
      </Section>

      <Section
        title="站点"
        accent={line.theme[2]}
        action={<span className="text-xs text-muted-foreground">{line.stations.length} 站</span>}
      >
        <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
          {line.stations.map((id, index) => {
            const item = network.stations[id]
            const selected = id === pov.currentStationId
            return (
              <div
                key={id}
                className={cn(
                  'flex items-center gap-1 border-b px-2 py-1 last:border-b-0',
                  selected && 'bg-accent',
                )}
              >
                <button
                  type="button"
                  onClick={() => updatePov({ currentStationId: id, trainTerminalId: undefined })}
                  className="min-w-0 flex-1 truncate text-left text-sm"
                >
                  <span className="mr-1 text-xs tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item?.name.zh ?? id}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  aria-label="上移"
                  onClick={() => moveStation(line.id, id, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === line.stations.length - 1}
                  aria-label="下移"
                  onClick={() => moveStation(line.id, id, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  disabled={!canRemove}
                  aria-label="删除站点"
                  onClick={() => removeStation(line.id, id)}
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => addStation(line.id, pov.currentStationId)}
        >
          <Plus />
          在当前站后插入
        </Button>

        {station && (
          <div className="flex flex-col gap-1.5 rounded-md border bg-background p-2">
            <div className="text-xs font-medium">{station.name.zh}</div>
            <Field label="中文名">
              <TextInput
                value={station.name.zh ?? ''}
                onChange={(e) => renameStation(station.id, { ...station.name, zh: e.target.value })}
              />
            </Field>
            <Field label="英文名">
              <TextInput
                value={station.name.en ?? ''}
                onChange={(e) => renameStation(station.id, { ...station.name, en: e.target.value })}
              />
            </Field>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => {
            if (window.confirm('恢复内置合肥线网？当前编辑将全部丢失。')) resetNetwork()
          }}
        >
          <RotateCcw />
          恢复内置线网
        </Button>
      </Section>
    </div>
  )
}
