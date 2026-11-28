/**
 * 线网图布局：为单条线路计算每个站点在画布上的坐标。
 *
 * 主干用关键路径法按站数等距排列，支线挂在分出点与并入点之间。
 * 关键路径法来源：railmapgen/rmg 的 `src/svgs/methods/share.ts`（GPL-3.0），
 * 这里去掉其风格相关的线宽因子，只用纯拓扑。
 * @see https://github.com/railmapgen/rmg/blob/main/src/svgs/methods/share.ts
 */

import type { Line, Segment } from './model'

export type AdjacencyMatrix = Record<string, Record<string, number>>

export const adjacencyList = (segments: Segment[]): AdjacencyMatrix =>
  segments.reduce((acc, seg) => {
    acc[seg.from] ??= {}
    acc[seg.from][seg.to] ??= 0
    acc[seg.from][seg.to] += 1
    return acc
  }, {} as AdjacencyMatrix)

/**
 * 从邻接表求 `from` 到 `to` 的最长路径（关键路径）。
 * 不可达时返回 `len: -1`。
 */
export const criticalPathMethod = (
  from: string,
  to: string,
  adjMat: AdjacencyMatrix,
): { len: number; nodes: string[] } => {
  if (from === to) return { len: 0, nodes: [from] }

  const neighbours = adjMat[from]
  if (!neighbours) return { len: -1, nodes: [] }

  let best: { len: number; nodes: string[] } = { len: -1, nodes: [] }
  for (const child of Object.keys(neighbours)) {
    const cp = criticalPathMethod(child, to, adjMat)
    if (cp.len < 0) continue
    const len = neighbours[child] + cp.len
    if (len > best.len) best = { len, nodes: [from, ...cp.nodes] }
  }
  return best
}

/** 线路上全部有向段，方向一致。不闭合环线。 */
export const segmentsOfLine = (line: Line): Segment[] => {
  const segs: Segment[] = []
  for (let i = 0; i < line.stations.length - 1; i++) {
    segs.push({ from: line.stations[i], to: line.stations[i + 1] })
  }
  for (const branch of line.branches ?? []) {
    const anchor = branch[0]
    for (let i = 1; i < branch.length; i++) {
      // 支线首站是挂靠点，挂在主干上
      segs.push(i === 1 ? { from: anchor, to: branch[1] } : { from: branch[i - 1], to: branch[i] })
    }
  }
  return segs
}

export interface LayoutOptions {
  width: number
  height: number
  /** 左右两端留白比例，0..50。 */
  padding: number
  /** 主干纵向位置比例，0..100。 */
  yPercent: number
  /** 支线纵向偏移，占画布高度的百分比。 */
  branchSpacing: number
  /** 主干两端到站名的额外留白（像素）。 */
  endMargin: number
}

export interface NetworkLayout {
  xs: Record<string, number>
  ys: Record<string, number>
  mainPath: string[]
  branches: string[][]
  adjMat: AdjacencyMatrix
}

export const layoutLine = (line: Line, options: LayoutOptions): NetworkLayout => {
  const { width, height, padding, yPercent, branchSpacing, endMargin } = options
  const adjMat = adjacencyList(segmentsOfLine(line))
  const bothEnds = [line.stations[0], line.stations[line.stations.length - 1]]
  const pathFromGraph = criticalPathMethod(bothEnds[0], bothEnds[1], adjMat).nodes
  const mainPath =
    pathFromGraph.length === line.stations.length ? pathFromGraph : [...line.stations]

  const leftX = (width * padding) / 100 + endMargin
  const rightX = width * (1 - padding / 100) - endMargin
  const xs: Record<string, number> = {}
  const ys: Record<string, number> = {}
  const baseY = (height * yPercent) / 100

  mainPath.forEach((stnId, index) => {
    xs[stnId] = leftX + ((rightX - leftX) * index) / Math.max(1, mainPath.length - 1)
    ys[stnId] = baseY
  })

  // 支线：首站是主干上的挂靠点；若支线终点也在主干上则为并入点，否则为尽头站
  const branches = line.branches ?? []
  branches.forEach((branch) => {
    const [attachId, ...rest] = branch
    const attachX = xs[attachId] ?? leftX
    const lastId = branch[branch.length - 1]
    const mergeX =
      ys[lastId] !== undefined ? xs[lastId] : attachX + (rightX - leftX) / mainPath.length
    const branchY = baseY + (height * branchSpacing) / 100
    rest.forEach((stnId, index) => {
      xs[stnId] = attachX + (mergeX - attachX) * ((index + 1) / rest.length)
      ys[stnId] = branchY
    })
    if (ys[lastId] !== undefined) ys[lastId] = baseY
  })

  return { xs, ys, mainPath, branches, adjMat }
}

export type StationState = -1 | 0 | 1

/** 当前站为 0，行车方向上尚未经过为 1，已经过为 -1。 */
export const getStationStates = (
  orderedStations: string[],
  currentId: string,
): Record<string, StationState> => {
  const index = orderedStations.indexOf(currentId)
  return Object.fromEntries(
    orderedStations.map(
      (stnId, i) => [stnId, i === index ? 0 : i > index ? 1 : -1] as [string, StationState],
    ),
  )
}
