import { useState, memo, type CSSProperties } from 'react'
import { Check, PencilSimple, Tray, X } from '@phosphor-icons/react'
import type { AgentAction } from '@shared/agent-types'
import { Surface } from '@/components/ui-native/Surface'
import { Button } from '@/components/ui-native/Button'
import { TextArea } from '@/components/ui-native/TextArea'
import { EmptyState } from '@/components/ui-native/EmptyState'

interface ApprovalQueueProps {
  actions: readonly AgentAction[]
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onEdit: (id: number, output: string) => void
}

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 'var(--space-3)'
}

const HEADER: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)'
}

const ITEM: CSSProperties = {
  padding: 10,
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in oklch, var(--color-warning) 8%, transparent)',
  border: '1px solid color-mix(in oklch, var(--color-warning) 22%, transparent)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

export const ApprovalQueue = memo(function ApprovalQueue({
  actions, onApprove, onReject, onEdit
}: ApprovalQueueProps): React.ReactElement {
  const pending = actions.filter((a) => a.status === 'pending')

  if (pending.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-3)' }}>
        <EmptyState
          size="sm"
          icon={<Tray size={28} />}
          title="No items pending approval"
        />
      </Surface>
    )
  }

  return (
    <Surface variant="raised" radius="lg" bordered id="approval-queue" style={ROOT}>
      <div style={HEADER}>Pending approval ({pending.length})</div>
      {pending.map((action) => (
        <ApprovalItem
          key={action.id}
          action={action}
          onApprove={() => onApprove(action.id)}
          onReject={() => onReject(action.id)}
          onEdit={(output) => onEdit(action.id, output)}
        />
      ))}
    </Surface>
  )
})

interface ApprovalItemProps {
  action: AgentAction
  onApprove: () => void
  onReject: () => void
  onEdit: (output: string) => void
}

function ApprovalItem({ action, onApprove, onReject, onEdit }: ApprovalItemProps): React.ReactElement {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(action.output ?? '')

  return (
    <div style={ITEM}>
      {action.input && (
        <div style={{ fontSize: 12, color: 'var(--color-fg-secondary)' }}>
          <span style={{ color: 'var(--color-fg-tertiary)' }}>Input:</span> {action.input}
        </div>
      )}

      {editing ? (
        <>
          <TextArea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            minRows={3}
            aria-label="Edit response"
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="primary" onClick={() => { onEdit(editText); setEditing(false) }}>
              Save & approve
            </Button>
            <Button size="sm" variant="plain" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--color-fg-primary)', whiteSpace: 'pre-wrap' }}>
            {action.output}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" variant="primary" leading={<Check size={12} weight="bold" />} onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" leading={<PencilSimple size={12} weight="bold" />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" leading={<X size={12} weight="bold" />} onClick={onReject}>
              Reject
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
