import { memo, type CSSProperties } from 'react'
import {
  Bell, Tag, UserPlus, Clock, ShieldCheck, Warning, Robot
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { AgentAction, AgentActionType, AgentActionStatus } from '@shared/agent-types'
import { Surface } from '@/components/ui-native/Surface'
import { ListRow } from '@/components/ui-native/ListRow'
import { Pill } from '@/components/ui-native/Pill'
import { Skeleton } from '@/components/ui-native/Skeleton'
import { EmptyState } from '@/components/ui-native/EmptyState'

interface ActionFeedProps {
  actions: readonly AgentAction[]
  loading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}

const TYPE_ICONS: Record<AgentActionType, Icon> = {
  replied:   Bell,
  flagged:   Tag,
  welcomed:  UserPlus,
  scheduled: Clock,
  moderated: ShieldCheck,
  escalated: Warning
}

const TYPE_COLORS: Record<AgentActionType, string> = {
  replied:   'var(--color-accent)',
  flagged:   'var(--color-warning)',
  welcomed:  'var(--color-success)',
  scheduled: 'var(--color-accent)',
  moderated: 'var(--color-error)',
  escalated: 'var(--color-warning)'
}

const STATUS_PILL: Record<AgentActionStatus, { variant: 'neutral' | 'accent' | 'success' | 'warning' | 'error'; label: string }> = {
  completed: { variant: 'success', label: 'done'    },
  pending:   { variant: 'warning', label: 'pending' },
  approved:  { variant: 'accent',  label: 'approved' },
  rejected:  { variant: 'error',   label: 'rejected' },
  edited:    { variant: 'accent',  label: 'edited'  }
}

const TRAILING: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: 'var(--color-fg-tertiary)'
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const ActionFeed = memo(function ActionFeed({ actions, loading, selectedId, onSelect }: ActionFeedProps): React.ReactElement {
  if (loading && actions.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={48} />
        ))}
      </Surface>
    )
  }

  if (actions.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <EmptyState
          size="md"
          icon={<Robot size={40} />}
          title="No agent actions yet"
          subtitle="Once the agent runs, replies, flags, or moderations will appear here."
        />
      </Surface>
    )
  }

  return (
    <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {actions.map((action) => {
        const Icon = TYPE_ICONS[action.actionType]
        const color = TYPE_COLORS[action.actionType]
        const status = STATUS_PILL[action.status]
        return (
          <ListRow
            key={action.id}
            density="comfortable"
            selected={selectedId === action.id}
            onSelect={() => onSelect(action.id)}
            leading={<Icon size={16} weight="regular" color={color} />}
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textTransform: 'capitalize' }}>
                {action.actionType}
                <Pill size="sm" variant={status.variant}>{status.label}</Pill>
              </span>
            }
            subtitle={action.input ?? action.output ?? ''}
            trailing={
              <span style={TRAILING}>
                <Pill size="sm" variant={action.platform === 'discord' ? 'discord' : 'telegram'}>
                  {action.platform === 'discord' ? 'DC' : 'TG'}
                </Pill>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(action.createdAt)}</span>
              </span>
            }
          />
        )
      })}
    </Surface>
  )
})
