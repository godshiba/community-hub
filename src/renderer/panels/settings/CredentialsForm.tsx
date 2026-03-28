import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import type { Platform, CredentialsState } from '@shared/settings-types'

const PLATFORMS: Array<{
  id: Platform
  label: string
  colorClass: string
  placeholder: string
}> = [
  { id: 'discord', label: 'Discord', colorClass: 'text-discord', placeholder: 'Bot token (e.g. MTIz...)' },
  { id: 'telegram', label: 'Telegram', colorClass: 'text-telegram', placeholder: 'Bot token from @BotFather' }
]

export function CredentialsForm(): React.ReactElement {
  const [credentials, setCredentials] = useState<CredentialsState | null>(null)
  const [tokens, setTokens] = useState<Record<Platform, string>>({ discord: '', telegram: '' })
  const [visible, setVisible] = useState<Record<Platform, boolean>>({ discord: false, telegram: false })
  const [testing, setTesting] = useState<Platform | null>(null)
  const [saving, setSaving] = useState<Platform | null>(null)
  const [testResults, setTestResults] = useState<Record<Platform, { success: boolean; message: string } | null>>({
    discord: null,
    telegram: null
  })

  useEffect(() => {
    loadCredentials()
  }, [])

  async function loadCredentials(): Promise<void> {
    const result = await window.api.invoke('settings:loadCredentials')
    if (result.success) {
      setCredentials(result.data)
    }
  }

  async function handleSave(platform: Platform): Promise<void> {
    const token = tokens[platform].trim()
    if (!token) return

    setSaving(platform)
    const result = await window.api.invoke('settings:saveCredentials', {
      platform,
      token
    })

    if (result.success) {
      setTokens((prev) => ({ ...prev, [platform]: '' }))
      await loadCredentials()
    }
    setSaving(null)
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

  return (
    <div className="space-y-4">
      {PLATFORMS.map((p) => {
        const configured = credentials?.[p.id]?.configured ?? false
        const testResult = testResults[p.id]

        return (
          <GlassCard key={p.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-medium ${p.colorClass}`}>{p.label}</h3>
              {configured && (
                <span className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Configured
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor={`${p.id}-token`} className="text-xs text-text-secondary">
                  Bot Token
                </Label>
                <div className="relative mt-1">
                  <Input
                    id={`${p.id}-token`}
                    type={visible[p.id] ? 'text' : 'password'}
                    value={tokens[p.id]}
                    onChange={(e) => setTokens((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={configured ? '••••••••  (saved)' : p.placeholder}
                    className="bg-obsidian/50 border-glass-border pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {visible[p.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(p.id)}
                  disabled={!tokens[p.id].trim() || saving === p.id}
                >
                  {saving === p.id ? <Loader2 className="size-3.5 animate-spin" /> : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(p.id)}
                  disabled={!configured || testing === p.id}
                >
                  {testing === p.id ? <Loader2 className="size-3.5 animate-spin" /> : 'Test Connection'}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    testResult.success ? 'text-success' : 'text-error'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                  {testResult.message}
                </div>
              )}
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
