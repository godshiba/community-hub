import { memo } from 'react'
import { MessageSquare, Flag, UserPlus, Clock, Shield, AlertTriangle } from 'lucide-react'
import type { AgentAction, AgentActionType, AgentActionStatus } from '@shared/agent-types'
import { cn } from '@/lib/utils'
import { SkeletonCard } from '@/components/Skeleton'

interface ActionFeedProps {
  actions: readonly AgentAction[]
  loading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}

const TYPE_ICONS: Record<AgentActionType, React.ComponentType<{ className?: string }>> = {
  replied: MessageSquare,
  flagged: Flag,
  welcomed: UserPlus,
  scheduled: Clock,
  moderated: Shield,
  escalated: AlertTriangle
}

const TYPE_COLORS: Record<AgentActionType, string> = {
  replied: 'text-blue-400 bg-blue-400/10',
  flagged: 'text-orange-400 bg-orange-400/10',
  welcomed: 'text-green-400 bg-green-400/10',
  scheduled: 'text-purple-400 bg-purple-400/10',
  moderated: 'text-red-400 bg-red-400/10',
  escalated: 'text-yellow-400 bg-yellow-400/10'
}

const STATUS_DOTS: Record<AgentActionStatus, string> = {
  completed: 'bg-green-400',
  pending: 'bg-yellow-400',
  approved: 'bg-blue-400',
  rejected: 'bg-red-400',
  edited: 'bg-purple-400'
}

export const ActionFeed = memo(function ActionFeed({ actions, loading, selectedId, onSelect }: ActionFeedProps): React.ReactElement {
  if (loading && actions.length === 0) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-muted">
        <Shield className="size-6 mb-2 opacity-40" />
        <p className="text-xs">No agent actions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {actions.map((action) => {
        const Icon = TYPE_ICONS[action.actionType]
        const colorClass = TYPE_COLORS[action.actionType]
        const dotClass = STATUS_DOTS[action.status]

        return (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className={cn(
              'w-full text-left px-3 py-2 rounded transition-colors flex items-start gap-2.5',
              selectedId === action.id
                ? 'bg-accent/10 border border-accent/20'
                : 'hover:bg-white/[0.04]'
            )}
          >
            <div className={cn('p-1 rounded mt-0.5', colorClass)}>
              <Icon className="size-3" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-text-primary capitalize">
                  {action.actionType}
                </span>
                <span className="text-[10px] text-text-muted">{action.platform}</span>
                <div className={cn('size-1.5 rounded-full ml-auto', dotClass)} title={action.status} />
              </div>

              {action.input && (
                <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                  {action.input}
                </p>
              )}

              <span className="text-[10px] text-text-muted">
                {formatTime(action.createdAt)}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
})

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
