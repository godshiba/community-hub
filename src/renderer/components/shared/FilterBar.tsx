import { Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface SearchConfig {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface FilterBarProps {
  search?: SearchConfig
  filters?: FilterConfig[]
  count?: number
  countLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function FilterBar({
  search,
  filters,
  count,
  countLabel,
  actions,
  className
}: FilterBarProps): React.ReactElement {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {search && (
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? 'Search...'}
            className={cn(
              'w-full h-8 pl-8 pr-3 text-sm bg-glass-surface border border-glass-border rounded-[var(--radius-input)]',
              'text-text-primary placeholder:text-text-muted outline-none',
              'focus:border-accent/40 transition-colors'
            )}
          />
        </div>
      )}

      {filters?.map((filter) => (
        <Select
          key={filter.label}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="h-8 text-xs w-auto min-w-28 bg-glass-surface border-glass-border">
            <SelectValue placeholder={filter.placeholder ?? filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {count !== undefined && (
        <span className="text-xs text-text-muted ml-1">
          {count} {countLabel ?? 'items'}
        </span>
      )}

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
