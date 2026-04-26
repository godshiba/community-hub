import { memo, type CSSProperties } from 'react'
import { Robot, User } from '@phosphor-icons/react'
import type { AgentAction, AgentActionStatus } from '@shared/agent-types'
import { Pill } from '@/components/ui-native/Pill'
import { Divider } from '@/components/ui-native/Divider'
import { EmptyState } from '@/components/ui-native/EmptyState'

interface ActionDetailProps {
  action: AgentAction | null
}

const STATUS: Record<AgentActionStatus, { variant: 'neutral' | 'accent' | 'success' | 'warning' | 'error'; label: string }> = {
  completed: { variant: 'success', label: 'Completed' },
  pending:   { variant: 'warning', label: 'Pending'   },
  approved:  { variant: 'accent',  label: 'Approved'  },
  rejected:  { variant: 'error',   label: 'Rejected'  },
  edited:    { variant: 'accent',  label: 'Edited'    }
}

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)'
}

const META: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: 'var(--color-fg-tertiary)',
  flexWrap: 'wrap'
}

const SECTION_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)',
  marginBottom: 6
}

const BUBBLE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  padding: 10,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-fg-primary)',
  whiteSpace: 'pre-wrap'
}

function parseContext(context: string | null): Record<string, string> {
  if (!context) return {}
  try { return JSON.parse(context) as Record<string, string> }
  catch { return {} }
}

export const ActionDetail = memo(function ActionDetail({ action }: ActionDetailProps): React.ReactElement {
  if (!action) {
    return (
      <EmptyState
        size="md"
        icon={<Robot size={28} />}
        title="No action selected"
        subtitle="Pick an action from the feed to see the input, the agent's response, and any rationale."
      />
    )
  }

  const context = parseContext(action.context)
  const statusInfo = STATUS[action.status]

  return (
    <div style={ROOT}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-fg-primary)', textTransform: 'capitalize' }}>
          {action.actionType}
        </div>
        <div style={META}>
          <Pill size="sm" variant={statusInfo.variant}>{statusInfo.label}</Pill>
          <Pill size="sm" variant={action.platform === 'discord' ? 'discord' : 'telegram'}>
            {action.platform === 'discord' ? 'Discord' : 'Telegram'}
          </Pill>
          {context.username && <span>by {context.username}</span>}
          <span style={{ marginLeft: 'auto' }}>{new Date(action.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <Divider />

      {action.input && (
        <div>
          <div style={SECTION_LABEL}>
            <User size={11} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {context.username ?? 'User'}
          </div>
          <div style={BUBBLE}>{action.input}</div>
        </div>
      )}

      {action.output && (
        <div>
          <div style={SECTION_LABEL}>
            <Robot size={11} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Agent
          </div>
          <div style={{ ...BUBBLE, background: 'var(--color-accent-fill)' }}>{action.output}</div>
        </div>
      )}

      {action.correction && (
        <div>
          <div style={SECTION_LABEL}>Correction</div>
          <div
            style={{
              ...BUBBLE,
              background: 'color-mix(in oklch, var(--color-accent) 8%, transparent)',
              border: '1px solid color-mix(in oklch, var(--color-accent) 25%, transparent)'
            }}
          >
            {action.correction}
          </div>
        </div>
      )}
    </div>
  )
})
