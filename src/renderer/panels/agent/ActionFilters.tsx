import { memo, type CSSProperties } from 'react'
import type { AgentActionType, AgentActionStatus } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import { Select } from '@/components/ui-native/Select'

interface ActionFiltersProps {
  filterType: AgentActionType | undefined
  filterPlatform: Platform | undefined
  filterStatus: AgentActionStatus | undefined
  onTypeChange: (type: AgentActionType | undefined) => void
  onPlatformChange: (platform: Platform | undefined) => void
  onStatusChange: (status: AgentActionStatus | undefined) => void
}

const TYPE_OPTIONS = [
  { value: 'all',       label: 'All types'  },
  { value: 'replied',   label: 'Replied'    },
  { value: 'flagged',   label: 'Flagged'    },
  { value: 'welcomed',  label: 'Welcomed'   },
  { value: 'scheduled', label: 'Scheduled'  },
  { value: 'moderated', label: 'Moderated'  },
  { value: 'escalated', label: 'Escalated'  }
] as const

const PLATFORM_OPTIONS = [
  { value: 'all',      label: 'All platforms' },
  { value: 'discord',  label: 'Discord'  },
  { value: 'telegram', label: 'Telegram' }
] as const

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'approved',  label: 'Approved'  },
  { value: 'rejected',  label: 'Rejected'  },
  { value: 'edited',    label: 'Edited'    }
] as const

const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap'
}

export const ActionFilters = memo(function ActionFilters({
  filterType, filterPlatform, filterStatus,
  onTypeChange, onPlatformChange, onStatusChange
}: ActionFiltersProps): React.ReactElement {
  return (
    <div style={ROW}>
      <Select
        size="sm"
        ariaLabel="Type filter"
        value={filterType ?? 'all'}
        onChange={(v) => onTypeChange(v === 'all' ? undefined : (v as AgentActionType))}
        options={TYPE_OPTIONS}
      />
      <Select
        size="sm"
        ariaLabel="Platform filter"
        value={filterPlatform ?? 'all'}
        onChange={(v) => onPlatformChange(v === 'all' ? undefined : (v as Platform))}
        options={PLATFORM_OPTIONS}
      />
      <Select
        size="sm"
        ariaLabel="Status filter"
        value={filterStatus ?? 'all'}
        onChange={(v) => onStatusChange(v === 'all' ? undefined : (v as AgentActionStatus))}
        options={STATUS_OPTIONS}
      />
    </div>
  )
})
