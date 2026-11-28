/**
 * 线网工作区：线路增删与改名改色、站点增删调序、换乘的建立与解除。
 *
 * 编辑结果即时写入项目，右侧预览（地图或示意）同步刷新；
 * 换乘关系由站点归属推导，合并 / 拆分后自动重建。
 */

import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HEFEI_PALETTE } from '@/data/palette'
import { linesOfStation } from '@/core/network'
import { useEditorStore } from '@/state/editor'
import { useProjectStore } from '@/state/project'
import { cn } from '@/lib/utils'
import { Field, Section, TextInput } from './panel-ui'

export const NetworkPanel = () => {
  const {
    project,
    updatePov,
    updateLineName,
    updateLineTheme,
    addLine,
    removeLine,
    addStation,
    moveStation,
    removeStation,
    renameStation,
    splitStation,
    mergeStations,
    resetNetwork,
  } = useProjectStore()
  const viewCenter = useEditorStore((s) => s.viewCenter)
  const [targetLineId, setTargetLineId] = useState('')
  const [targetStationId, setTargetStationId] = useState('')

  const { network, pov } = project
  const line = network.lines.find((l) => l.id === pov.lineId) ?? network.lines[0]
  const station = network.stations[pov.currentStationId]
  const canRemoveStation = line.stations.length > 2
  const interchanges = Object.values(network.stations)
    .filter((s) => s.transfers.length > 0)
    .sort((a, b) => (a.name.zh ?? '').localeCompare(b.name.zh ?? '', 'zh-Hans-CN'))

  const otherLines = network.lines.filter((l) => l.id !== line.id)
  const targetLine =
    network.lines.find((l) => l.id === targetLineId && l.id !== line.id) ?? otherLines[0]

  // 目标线路上尚未与当前线路共站的站点，才能并入成为换乘
  const targetCandidates = targetLine
    ? targetLine.stations.filter((id) => !linesOfStation(network, id).includes(line.id))
    : []

  const nearestOn = () => {
    if (!station?.geo) return targetCandidates[0] ?? ''
    let best = targetCandidates[0] ?? ''
    let bestDistance = Infinity
    for (const id of targetCandidates) {
      const geo = network.stations[id]?.geo
      if (!geo) continue
      const dx = (geo.lng - station.geo.lng) * Math.cos((station.geo.lat * Math.PI) / 180)
      const dy = geo.lat - station.geo.lat
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        best = id
      }
    }
    return best
  }

  const effectiveTargetStation =
    targetStationId && targetCandidates.includes(targetStationId) ? targetStationId : nearestOn()

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

        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => addLine(viewCenter)}>
            <Plus />
            新建线路
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={network.lines.length <= 1}
            onClick={() => {
              if (window.confirm(`删除「${line.name.zh}」及其独有站点？`)) removeLine(line.id)
            }}
          >
            <Trash2 />
            删除线路
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
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
        <div className="max-h-56 overflow-y-auto rounded-md border bg-background">
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
                  disabled={!canRemoveStation}
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
      </Section>

      <Section
        title="换乘"
        action={<span className="text-xs text-muted-foreground">{interchanges.length} 座</span>}
      >
        <div className="max-h-40 overflow-y-auto rounded-md border bg-background">
          {interchanges.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground">还没有换乘站</div>
          )}
          {interchanges.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 border-b px-2 py-1 last:border-b-0"
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm"
                onClick={() => {
                  const owner = linesOfStation(network, item.id)[0]
                  updatePov({
                    lineId: owner ?? pov.lineId,
                    currentStationId: item.id,
                    trainTerminalId: undefined,
                  })
                }}
              >
                {item.name.zh}
              </button>
              <div className="flex flex-wrap justify-end gap-1">
                {linesOfStation(network, item.id).map((lineId) => {
                  const l = network.lines.find((entry) => entry.id === lineId)
                  if (!l) return null
                  return (
                    <button
                      key={lineId}
                      type="button"
                      title={`把「${l.name.zh}」从此站拆出`}
                      onClick={() => {
                        if (
                          window.confirm(`把「${l.name.zh}」从「${item.name.zh}」拆出为独立站？`)
                        ) {
                          splitStation(lineId, item.id)
                        }
                      }}
                      className="rounded px-1 text-[10px] font-medium hover:ring-1 hover:ring-foreground/40"
                      style={{ backgroundColor: l.theme[2], color: l.theme[3] }}
                    >
                      {l.name.zh}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {station && targetLine && (
          <div className="flex flex-col gap-1.5 rounded-md border bg-background p-2">
            <div className="text-xs text-muted-foreground">
              把本站并入另一条线的站点，成为换乘站
            </div>
            <select
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={targetLine.id}
              onChange={(e) => {
                setTargetLineId(e.target.value)
                setTargetStationId('')
              }}
            >
              {otherLines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name.zh}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              value={effectiveTargetStation}
              onChange={(e) => setTargetStationId(e.target.value)}
            >
              {targetCandidates.map((id) => (
                <option key={id} value={id}>
                  {network.stations[id]?.name.zh ?? id}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!effectiveTargetStation || targetCandidates.length === 0}
              onClick={() => {
                if (!effectiveTargetStation) return
                mergeStations(effectiveTargetStation, station.id)
                setTargetStationId('')
              }}
            >
              建立换乘
            </Button>
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
