import { describe, expect, it } from 'vite-plus/test'
import { buildSeedNetwork } from '@/data/hefei'
import { composeAnnouncement, DEFAULT_TEMPLATES, resolveScene } from './announce'
import { layoutLine, getStationStates } from './layout'
import { getMaterialInfo, walkRoute } from './material'
import { recomputeTransfers } from './network'
import { fromRmgParams, traverseRmgStations } from './rmg-import'
import type { StationPov } from './model'

const network = buildSeedNetwork()
const id = (zh: string) => `s-${zh}`
const pov = (overrides: Partial<StationPov> = {}): StationPov => ({
  lineId: 'hf1',
  currentStationId: id('大东门'),
  direction: 'r',
  doorSide: 'left',
  ...overrides,
})

describe('seed network', () => {
  it('has nine lines and 205 stations (including one suspended)', () => {
    expect(network.lines).toHaveLength(9)
    expect(Object.keys(network.stations)).toHaveLength(205)
  })

  it('marks the twenty interchange stations', () => {
    const interchanges = Object.values(network.stations)
      .filter((s) => s.transfers.length > 0)
      .map((s) => s.name.zh ?? '')
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    expect(interchanges).toEqual(
      [
        '一里井',
        '三孝口',
        '东七里',
        '云谷路',
        '六中菱湖校区',
        '北雁湖',
        '合肥南站',
        '合肥火车站',
        '合肥西站',
        '图书馆',
        '市第三医院',
        '尧渡河路',
        '大东门',
        '方庙',
        '朱岗',
        '洪岗',
        '海棠',
        '繁华大道',
        '紫庐',
        '西七里塘',
      ].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
    )
  })

  it('has no dangling station reference', () => {
    for (const line of network.lines) {
      for (const stationId of line.stations) {
        expect(network.stations[stationId], `${line.id} -> ${stationId}`).toBeDefined()
      }
    }
  })
})

describe('network edits', () => {
  it('drops the transfer when a line stops serving an interchange', () => {
    const before = network.stations[id('大东门')]
    expect(before.transfers).toHaveLength(1)

    const edited = recomputeTransfers({
      ...network,
      lines: network.lines.map((line) =>
        line.id === 'hf2'
          ? { ...line, stations: line.stations.filter((s) => s !== id('大东门')) }
          : line,
      ),
    })

    expect(edited.stations[id('大东门')].transfers).toEqual([])
    // 原线网不被就地修改
    expect(before.transfers).toHaveLength(1)
  })
})

describe('travel along a line', () => {
  it('walks from the origin towards the end', () => {
    const route = walkRoute(network, pov())
    expect(route[0]).toBe(id('大东门'))
    expect(route[1]).toBe(id('包公园'))
    expect(route.at(-1)).toBe(id('九联圩'))
    expect(route).toHaveLength(20)
  })

  it('stops at the train terminal', () => {
    const route = walkRoute(network, pov({ trainTerminalId: id('合肥南站') }))
    expect(route.at(-1)).toBe(id('合肥南站'))
  })

  it('travels the other way when direction is left', () => {
    const info = getMaterialInfo(network, pov({ direction: 'l' }))
    expect(info.route[1]).toBe(id('明光路'))
    expect(info.terminalName.zh).toBe('张洼')
    expect(info.passed[0]).toBe(id('包公园'))
    expect(info.nextName.zh).toBe('明光路')
  })

  it('reports passed stations', () => {
    const info = getMaterialInfo(network, pov())
    expect(info.passed).toEqual([
      id('明光路'),
      id('长淮'),
      id('合肥火车站'),
      id('瑶海公园'),
      id('兴华苑'),
      id('张洼'),
    ])
  })

  it('finds the next interchange', () => {
    const info = getMaterialInfo(network, pov())
    expect(info.nextInterchanges.map((l) => l.name.zh)).toEqual([])
    // 合肥火车站的下一站是长淮；从合肥南站出发的下一站是南站南广场
    const atHefeiStation = getMaterialInfo(network, pov({ currentStationId: id('朱岗') }))
    expect(atHefeiStation.nextInterchanges.map((l) => l.name.zh)).toEqual([])
  })

  it('handles the terminal', () => {
    const info = getMaterialInfo(network, pov({ currentStationId: id('九联圩') }))
    expect(info.atTerminal).toBe(true)
    expect(info.isNextTerminal).toBe(false)
    expect(resolveScene('auto', info)).toBe('arrivalTerminal')
  })

  it('detects the station before the terminal', () => {
    const info = getMaterialInfo(network, pov({ currentStationId: id('丙子铺') }))
    expect(info.isNextTerminal).toBe(true)
    expect(resolveScene('auto', info)).toBe('departureTerminal')
  })
})

describe('announcement text', () => {
  it('composes the departure text', () => {
    const { scene, texts } = composeAnnouncement(network, pov(), 'auto', DEFAULT_TEMPLATES)
    expect(scene).toBe('departure')
    expect(texts.zh).toBe('下一站：包公园。开左门。')
    expect(texts.en).toBe('Next station: Baogongyuan. Doors will open on the left.')
  })

  it('names the current station interchange on arrival', () => {
    const { scene, texts } = composeAnnouncement(
      network,
      pov({ currentStationId: id('朱岗') }),
      'arrival',
      DEFAULT_TEMPLATES,
    )
    expect(scene).toBe('arrival')
    expect(texts.zh).toContain('朱岗站到了')
  })

  it('composes the arrival text for the terminal', () => {
    const { texts } = composeAnnouncement(
      network,
      pov({ currentStationId: id('九联圩') }),
      'auto',
      DEFAULT_TEMPLATES,
    )
    expect(texts.zh).toContain('九联圩站到了，本次列车终点站')
    expect(texts.en).toContain('the terminal station of this train')
  })
})

describe('layout', () => {
  it('lays stations out monotonically', () => {
    const line = network.lines[0]
    const layout = layoutLine(line, {
      width: 2020,
      height: 300,
      padding: 4,
      yPercent: 50,
      branchSpacing: 20,
      endMargin: 90,
    })
    const xs = line.stations.map((s) => layout.xs[s])
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    expect(new Set(Object.values(layout.ys)).size).toBe(1)
  })

  it('computes station states in travel direction', () => {
    const states = getStationStates(['a', 'b', 'c'], 'b')
    expect(states).toEqual({ a: -1, b: 0, c: 1 })
  })
})

describe('rmg import', () => {
  const template = {
    theme: ['hefei', 'hf1', '#e61f24', '#fff'],
    line_name: ['1号线', 'Line 1'],
    stn_list: {
      linestart: { name: ['LEFT END', 'LEFT END'], children: ['a'], parents: [] },
      a: {
        localisedName: { zh: '甲', en: 'A' },
        parents: ['linestart'],
        children: ['b'],
        transfer: {
          groups: [
            { lines: [{ theme: ['hefei', 'hf2', '#0167b1', '#fff'], name: ['2号线', 'Line 2'] }] },
          ],
        },
        services: ['local'],
      },
      b: {
        localisedName: { zh: '乙', en: 'B' },
        parents: ['a'],
        children: ['lineend'],
        transfer: { groups: [{}] },
      },
      lineend: { name: ['RIGHT END', 'RIGHT END'], parents: ['b'], children: [] },
    },
  } as unknown as Parameters<typeof fromRmgParams>[0][string]

  it('restores the main line', () => {
    const { main } = traverseRmgStations(template.stn_list)
    expect(main).toEqual(['a', 'b'])
  })

  it('converts names, transfers and services', () => {
    const { lines, stations } = fromRmgParams({ hf1: template })
    expect(lines[0].stations).toEqual(['a', 'b'])
    expect(stations.a.name.zh).toBe('甲')
    expect(stations.a.transfers[0].lines[0].name.zh).toBe('2号线')
    expect(stations.b.services).toEqual(['local'])
  })
})
