import { useEffect } from 'react'
import { useConnectionStore } from '@/stores/connection.store'
import type { ConnectionStatus } from '@shared/settings-types'

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'text-text-muted',
  connecting: 'text-warning',
  connected: 'text-success',
  error: 'text-error'
}

export function StatusBar(): React.ReactElement {
  const { discord, telegram, fetchStatus } = useConnectionStore()

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 5000)
    return () => clearInterval(id)
  }, [fetchStatus])

  return (
    <div className="h-6 bg-glass-surface border-t border-glass-border flex items-center justify-between px-4 text-[11px] shrink-0">
      <div className="flex items-center gap-3">
        <StatusDot status={discord} label="Discord" />
        <StatusDot status={telegram} label="Telegram" />
      </div>

      <div className="text-text-muted">
        Agent: <span className="text-text-secondary">Disabled</span>
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
}

function StatusDot({ status, label }: StatusDotProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`size-1.5 rounded-full ${STATUS_COLORS[status]} bg-current`} />
      <span className="text-text-muted">{label}</span>
    </div>
  )
}
