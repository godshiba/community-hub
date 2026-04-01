import { Pause, Play, Activity } from 'lucide-react'
import type { AgentStatus } from '@shared/agent-types'
import { cn } from '@/lib/utils'

interface AgentControlsProps {
  status: AgentStatus | null
  onPause: () => void
  onResume: () => void
}

const STATE_CONFIG = {
  running: { label: 'Running', color: 'text-green-400', bg: 'bg-green-400/10', dot: 'bg-green-400' },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
  unavailable: { label: 'Unavailable', color: 'text-text-muted', bg: 'bg-white/5', dot: 'bg-text-muted' }
} as const

export function AgentControls({ status, onPause, onResume }: AgentControlsProps): React.ReactElement {
  const state = status?.state ?? 'unavailable'
  const config = STATE_CONFIG[state]

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium', config.bg, config.color)}>
        <div className={cn('size-1.5 rounded-full', config.dot)} />
        {config.label}
      </div>

      {status?.provider && (
        <span className="text-xs text-text-muted">{status.provider}</span>
      )}

      <div className="flex items-center gap-1 text-xs text-text-secondary">
        <Activity className="size-3" />
        <span>{status?.actionsToday ?? 0} today</span>
        {(status?.pendingApproval ?? 0) > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-accent/20 text-accent rounded-full text-[10px] font-medium">
            {status!.pendingApproval} pending
          </span>
        )}
      </div>

      {state === 'running' && (
        <button
          onClick={onPause}
          className="p-1.5 text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
          title="Pause agent"
        >
          <Pause className="size-3.5" />
        </button>
      )}

      {state === 'paused' && (
        <button
          onClick={onResume}
          className="p-1.5 text-text-muted hover:text-green-400 hover:bg-green-400/10 rounded transition-colors"
          title="Resume agent"
        >
          <Play className="size-3.5" />
        </button>
      )}
    </div>
  )
}
