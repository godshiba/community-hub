import { useState, memo } from 'react'
import { Check, X, Pencil, Inbox } from 'lucide-react'
import type { AgentAction } from '@shared/agent-types'

interface ApprovalQueueProps {
  actions: readonly AgentAction[]
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onEdit: (id: number, output: string) => void
}

export const ApprovalQueue = memo(function ApprovalQueue({ actions, onApprove, onReject, onEdit }: ApprovalQueueProps): React.ReactElement {
  const pending = actions.filter((a) => a.status === 'pending')

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-text-muted">
        <Inbox className="size-6 mb-2 opacity-40" />
        <p className="text-xs">No items pending approval</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        Pending Approval ({pending.length})
      </h3>
      {pending.map((action) => (
        <ApprovalItem
          key={action.id}
          action={action}
          onApprove={() => onApprove(action.id)}
          onReject={() => onReject(action.id)}
          onEdit={(output) => onEdit(action.id, output)}
        />
      ))}
    </div>
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

  const handleSave = (): void => {
    onEdit(editText)
    setEditing(false)
  }

  return (
    <div className="p-3 bg-yellow-400/5 border border-yellow-400/15 rounded space-y-2">
      {action.input && (
        <div className="text-[11px] text-text-secondary">
          <span className="text-text-muted">Input:</span> {action.input}
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-glass-surface border border-glass-border rounded px-2 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent/50"
            rows={3}
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-[10px] font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
            >
              Save & Approve
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-1 text-[10px] font-medium text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-xs text-text-primary">{action.output}</div>

          <div className="flex gap-1">
            <button
              onClick={onApprove}
              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors"
              title="Approve"
            >
              <Check className="size-3.5" />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={onReject}
              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Reject"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
