import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SegmentedControlProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-center bg-glass-surface border border-glass-border rounded-[var(--radius-input)] p-0.5',
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-[calc(var(--radius-input)-2px)] transition-all duration-150 select-none',
            value === opt.value
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
