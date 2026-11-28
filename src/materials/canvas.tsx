/**
 * 物料画布：所有物料共用的 SVG 外壳。
 *
 * 与 rmg 的 `SvgWrapper` 同构：固定 viewBox、通过 CSS 变量暴露线色与尺寸，
 * 导出时直接序列化本元素即可。区别是不再依赖外部样式表注入，
 * 物料自带的类名（`metro-*`）全部定义在本仓库的 `globals.css` 里。
 */

import type { ReactNode } from 'react'
import type { CanvasKind, Theme } from '@/core/model'

interface MaterialCanvasProps {
  /** 物料类型；线网工作区里的线路示意用 `line-map`。 */
  kind: CanvasKind | 'line-map'
  width: number
  height: number
  theme: Theme
  background?: string
  children: ReactNode
}

export const MaterialCanvas = (props: MaterialCanvasProps) => {
  const { kind, width, height, theme, background = '#ffffff', children } = props
  return (
    <svg
      id={`metro-${kind}`}
      className="material-canvas"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${kind} material`}
      style={
        {
          '--metro-width': `${width}px`,
          '--metro-height': `${height}px`,
          '--metro-line-colour': theme[2],
          '--metro-line-fg': theme[3],
          backgroundColor: background,
        } as React.CSSProperties
      }
    >
      <rect width={width} height={height} fill={background} />
      {children}
    </svg>
  )
}
