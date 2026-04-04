import { useEffect } from 'react'
import { useConnectionStore } from '@/stores/connection.store'
import { useAgentStore } from '@/stores/agent.store'
import { usePanelStore } from '@/stores/panel.store'
import type { ConnectionStatus } from '@shared/settings-types'

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'text-text-muted',
  connecting: 'text-warning',
  connected: 'text-success',
  error: 'text-error'
}

const AGENT_STATE_LABELS: Record<string, { label: string; color: string }> = {
  unavailable: { label: 'Disabled', color: 'text-text-muted' },
  idle: { label: 'Idle', color: 'text-text-secondary' },
  active: { label: 'Active', color: 'text-success' },
  paused: { label: 'Paused', color: 'text-warning' },
  error: { label: 'Error', color: 'text-error' }
}

export function StatusBar(): React.ReactElement {
  const { discord, telegram, fetchStatus } = useConnectionStore()
  const agentStatus = useAgentStore((s) => s.status)
  const pendingCount = useAgentStore((s) => s.actions.filter((a) => a.status === 'pending').length)
  const setActivePanel = usePanelStore((s) => s.setActivePanel)

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 5000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const agentState = agentStatus?.state ?? 'unavailable'
  const agentInfo = AGENT_STATE_LABELS[agentState] ?? AGENT_STATE_LABELS.idle

  return (
    <div className="h-6 bg-glass-surface border-t border-glass-border flex items-center justify-between px-4 text-xs shrink-0">
      <div className="flex items-center gap-3">
        <StatusDot
          status={discord}
          label="Discord"
          onClick={() => setActivePanel('settings')}
        />
        <StatusDot
          status={telegram}
          label="Telegram"
          onClick={() => setActivePanel('settings')}
        />
      </div>

      <div className="flex items-center gap-1.5 text-text-muted">
        <span>Agent:</span>
        <span className={agentInfo.color}>{agentInfo.label}</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-warning/20 text-warning rounded-full leading-none">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="text-text-muted">
        {discord === 'connected' || telegram === 'connected' ? 'Online' : 'Offline'}
      </div>
    </div>
  )
}

interface StatusDotProps {
  status: ConnectionStatus
  label: string
  onClick?: () => void
}

function StatusDot({ status, label, onClick }: StatusDotProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      title={`${label}: ${status}`}
    >
      <div className={`size-1.5 rounded-full ${STATUS_COLORS[status]} bg-current`} />
      <span className="text-text-muted">{label}</span>
    </button>
  )
}
