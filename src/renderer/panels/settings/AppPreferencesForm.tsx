import { useState, useEffect, useRef } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { AppPreferences } from '@shared/settings-types'

const DEFAULTS: AppPreferences = {
  statsRefreshMinutes: 60,
  memberSyncHours: 6,
  panelLayoutPersist: true
}

export function AppPreferencesForm(): React.ReactElement {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadPrefs()
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  async function loadPrefs(): Promise<void> {
    const result = await window.api.invoke('settings:loadPreferences')
    if (result.success) {
      setPrefs(result.data)
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    const result = await window.api.invoke('settings:savePreferences', prefs)
    if (result.success) {
      setSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <GlassCard className="p-4 space-y-5">
      <div>
        <Label htmlFor="stats-refresh" className="text-xs text-text-secondary">
          Stats refresh interval (minutes)
        </Label>
        <Input
          id="stats-refresh"
          type="number"
          min={5}
          max={1440}
          value={prefs.statsRefreshMinutes}
          onChange={(e) => {
            setPrefs((prev) => ({ ...prev, statsRefreshMinutes: parseInt(e.target.value, 10) || 60 }))
            setSaved(false)
          }}
          className="mt-1 w-32 bg-obsidian/50 border-glass-border"
        />
      </div>

      <div>
        <Label htmlFor="member-sync" className="text-xs text-text-secondary">
          Member sync interval (hours)
        </Label>
        <Input
          id="member-sync"
          type="number"
          min={1}
          max={48}
          value={prefs.memberSyncHours}
          onChange={(e) => {
            setPrefs((prev) => ({ ...prev, memberSyncHours: parseInt(e.target.value, 10) || 6 }))
            setSaved(false)
          }}
          className="mt-1 w-32 bg-obsidian/50 border-glass-border"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="layout-persist" className="text-xs text-text-secondary">
          Remember panel layout across sessions
        </Label>
        <Switch
          id="layout-persist"
          checked={prefs.panelLayoutPersist}
          onCheckedChange={(checked) => {
            setPrefs((prev) => ({ ...prev, panelLayoutPersist: checked }))
            setSaved(false)
          }}
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Save'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3" /> Saved
          </span>
        )}
      </div>
    </GlassCard>
  )
}
