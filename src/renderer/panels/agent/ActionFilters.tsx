import { memo } from 'react'
import type { AgentActionType, AgentActionStatus } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import { cn } from '@/lib/utils'

interface ActionFiltersProps {
  filterType: AgentActionType | undefined
  filterPlatform: Platform | undefined
  filterStatus: AgentActionStatus | undefined
  onTypeChange: (type: AgentActionType | undefined) => void
  onPlatformChange: (platform: Platform | undefined) => void
  onStatusChange: (status: AgentActionStatus | undefined) => void
}

const ACTION_TYPES: AgentActionType[] = ['replied', 'flagged', 'welcomed', 'scheduled', 'moderated', 'escalated']
const STATUSES: AgentActionStatus[] = ['completed', 'pending', 'approved', 'rejected', 'edited']
const PLATFORMS: Platform[] = ['discord', 'telegram']

export const ActionFilters = memo(function ActionFilters({
  filterType,
  filterPlatform,
  filterStatus,
  onTypeChange,
  onPlatformChange,
  onStatusChange
}: ActionFiltersProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterGroup
        label="Type"
        options={ACTION_TYPES}
        value={filterType}
        onChange={onTypeChange}
      />
      <FilterGroup
        label="Platform"
        options={PLATFORMS}
        value={filterPlatform}
        onChange={onPlatformChange}
      />
      <FilterGroup
        label="Status"
        options={STATUSES}
        value={filterStatus}
        onChange={onStatusChange}
      />
    </div>
  )
})

interface FilterGroupProps<T extends string> {
  label: string
  options: T[]
  value: T | undefined
  onChange: (value: T | undefined) => void
}

function FilterGroup<T extends string>({ label, options, value, onChange }: FilterGroupProps<T>): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted">{label}:</span>
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          'px-1.5 py-0.5 text-[10px] rounded transition-colors',
          value === undefined
            ? 'bg-accent/20 text-accent'
            : 'text-text-muted hover:text-text-secondary'
        )}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(value === opt ? undefined : opt)}
          className={cn(
            'px-1.5 py-0.5 text-[10px] rounded capitalize transition-colors',
            value === opt
              ? 'bg-accent/20 text-accent'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
