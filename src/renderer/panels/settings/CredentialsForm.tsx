import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Plug, Unplug } from 'lucide-react'
import { useConnectionStore } from '@/stores/connection.store'
import type { Platform, CredentialsState, ConnectionStatus } from '@shared/settings-types'

const PLATFORMS: Array<{
  id: Platform
  label: string
  colorClass: string
  description: string
}> = [
  { id: 'discord', label: 'Discord', colorClass: 'text-discord', description: 'Bot token from .env' },
  { id: 'telegram', label: 'Telegram', colorClass: 'text-telegram', description: 'Bot token from .env' }
]

const STATUS_LABELS: Record<ConnectionStatus, { text: string; className: string }> = {
  disconnected: { text: 'Disconnected', className: 'text-text-muted' },
  connecting: { text: 'Connecting...', className: 'text-warning' },
  connected: { text: 'Connected', className: 'text-success' },
  error: { text: 'Error', className: 'text-error' }
}

export function CredentialsForm(): React.ReactElement {
  const [credentials, setCredentials] = useState<CredentialsState | null>(null)
  const [testing, setTesting] = useState<Platform | null>(null)
  const [connecting, setConnecting] = useState<Platform | null>(null)
  const [testResults, setTestResults] = useState<Record<Platform, { success: boolean; message: string } | null>>({
    discord: null,
    telegram: null
  })

  const connectionStatus = useConnectionStore()

  useEffect(() => {
    loadCredentials()
  }, [])

  async function loadCredentials(): Promise<void> {
    const result = await window.api.invoke('settings:loadCredentials')
    if (result.success) {
      setCredentials(result.data)
    }
  }

  async function handleTest(platform: Platform): Promise<void> {
    setTesting(platform)
    setTestResults((prev) => ({ ...prev, [platform]: null }))

    const result = await window.api.invoke('settings:testConnection', { platform })
    if (result.success) {
      const conn = result.data
      setTestResults((prev) => ({
        ...prev,
        [platform]: {
          success: conn.success,
          message: conn.success ? `Connected as ${conn.username}` : (conn.error ?? 'Connection failed')
        }
      }))
    } else {
      setTestResults((prev) => ({
        ...prev,
        [platform]: { success: false, message: result.error }
      }))
    }
    setTesting(null)
  }

  async function handleConnect(platform: Platform): Promise<void> {
    setConnecting(platform)
    await window.api.invoke('settings:connectPlatform', { platform })
    await connectionStatus.fetchStatus()
    setConnecting(null)
  }

  async function handleDisconnect(platform: Platform): Promise<void> {
    await window.api.invoke('settings:disconnectPlatform', { platform })
    await connectionStatus.fetchStatus()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted mb-2">
        Bot tokens are read from <code className="text-text-secondary">.env</code> in the project root.
        Edit that file to change credentials.
      </p>

      {PLATFORMS.map((p) => {
        const configured = credentials?.[p.id]?.configured ?? false
        const status = connectionStatus[p.id]
        const statusInfo = STATUS_LABELS[status]
        const testResult = testResults[p.id]
        const isConnected = status === 'connected'

        return (
          <GlassCard key={p.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-medium ${p.colorClass}`}>{p.label}</h3>
                <p className="text-xs text-text-muted mt-0.5">{p.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {configured && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Token set
                  </span>
                )}
                <span className={`text-xs ${statusInfo.className}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <Button size="sm" variant="outline" onClick={() => handleDisconnect(p.id)}>
                  <Unplug className="size-3.5" /> Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleConnect(p.id)}
                  disabled={!configured || connecting === p.id}
                >
                  {connecting === p.id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Plug className="size-3.5" />}
                  Connect
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTest(p.id)}
                disabled={!configured || testing === p.id}
              >
                {testing === p.id ? <Loader2 className="size-3.5 animate-spin" /> : 'Test'}
              </Button>
            </div>

            {testResult && (
              <div
                className={`flex items-center gap-1.5 text-xs mt-2 ${
                  testResult.success ? 'text-success' : 'text-error'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {testResult.message}
              </div>
            )}
          </GlassCard>
        )
      })}
    </div>
  )
}
