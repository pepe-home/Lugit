/**
 * 右侧控制面板：顶部标签切换「线网」与「车站」两个工作区。
 */

import { MapPin, Route } from 'lucide-react'
import { useEditorStore, type Workspace } from '@/state/editor'
import { cn } from '@/lib/utils'
import { NetworkPanel } from './network-panel'
import { StationPanel } from './station-panel'

const TABS: { value: Workspace; label: string; icon: typeof Route }[] = [
  { value: 'network', label: '线网', icon: Route },
  { value: 'station', label: '车站', icon: MapPin },
]

export const ControlPanel = () => {
  const workspace = useEditorStore((s) => s.workspace)
  const setWorkspace = useEditorStore((s) => s.setWorkspace)

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l bg-muted/20">
      <div role="tablist" className="grid grid-cols-2 border-b bg-background">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={workspace === value}
            onClick={() => setWorkspace(value)}
            className={cn(
              'flex items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors',
              workspace === value
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {workspace === 'network' ? <NetworkPanel /> : <StationPanel />}
      </div>
    </aside>
  )
}
