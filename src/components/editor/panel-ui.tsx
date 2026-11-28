/**
 * 侧栏共用的小部件：分组、分段选择、表单行。
 */

import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  accent?: string
  action?: ReactNode
  children: ReactNode
}

export const Section = ({ title, accent, action, children }: SectionProps) => (
  <section className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {accent && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
        )}
        {title}
      </h2>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    {children}
  </section>
)

export interface SegmentedOption {
  value: string
  label: ReactNode
}

interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
}

export const Segmented = ({ options, value, onChange }: SegmentedProps) => (
  <div className="flex rounded-md border bg-background p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
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

interface FieldProps {
  label: string
  children: ReactNode
}

export const Field = ({ label, children }: FieldProps) => (
  <label className="flex items-center gap-2 text-sm">
    <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
)

export const TextInput = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="text"
    className={cn(
      'min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
      className,
    )}
    {...props}
  />
)
