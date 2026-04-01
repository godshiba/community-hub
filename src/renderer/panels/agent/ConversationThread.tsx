import { User, Bot } from 'lucide-react'
import type { AgentAction } from '@shared/agent-types'

interface ConversationThreadProps {
  action: AgentAction | null
}

export function ConversationThread({ action }: ConversationThreadProps): React.ReactElement {
  if (!action) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-muted">
        Select an action to view details
      </div>
    )
  }

  const context = parseContext(action.context)

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2 text-xs text-text-muted border-b border-glass-border pb-2">
        <span className="capitalize font-medium text-text-secondary">{action.actionType}</span>
        <span>on {action.platform}</span>
        {context.username && <span>by {context.username}</span>}
        <span className="ml-auto">{new Date(action.createdAt).toLocaleString()}</span>
      </div>

      {action.input && (
        <div className="flex gap-2">
          <div className="shrink-0 p-1.5 bg-blue-400/10 text-blue-400 rounded mt-0.5">
            <User className="size-3" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-text-muted mb-0.5">{context.username ?? 'User'}</div>
            <div className="text-xs text-text-primary bg-white/[0.03] rounded px-2.5 py-2">
              {action.input}
            </div>
          </div>
        </div>
      )}

      {action.output && (
        <div className="flex gap-2">
          <div className="shrink-0 p-1.5 bg-accent/10 text-accent rounded mt-0.5">
            <Bot className="size-3" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-text-muted mb-0.5">Agent</div>
            <div className="text-xs text-text-primary bg-white/[0.03] rounded px-2.5 py-2">
              {action.output}
            </div>
          </div>
        </div>
      )}

      {action.correction && (
        <div className="px-3 py-2 bg-purple-400/5 border border-purple-400/15 rounded">
          <div className="text-[10px] text-purple-400 mb-0.5">Correction applied</div>
          <div className="text-xs text-text-primary">{action.correction}</div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <StatusBadge status={action.status} />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const colors: Record<string, string> = {
    completed: 'text-green-400 bg-green-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    approved: 'text-blue-400 bg-blue-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    edited: 'text-purple-400 bg-purple-400/10'
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${colors[status] ?? 'text-text-muted bg-white/5'}`}>
      {status}
    </span>
  )
}

function parseContext(context: string | null): Record<string, string> {
  if (!context) return {}
  try {
    return JSON.parse(context) as Record<string, string>
  } catch {
    return {}
  }
}
