import { useEffect, useState, useRef } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle2, Siren } from 'lucide-react'
import { useSpamStore } from '@/stores/spam.store'
import type { RaidConfig } from '@shared/spam-types'

export function RaidProtectionForm(): React.ReactElement {
  const { config, configLoading, fetchConfig, updateConfig, raidState, setManualLockdown, fetchRaidState } = useSpamStore()
  const [raid, setRaid] = useState<RaidConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchConfig()
    fetchRaidState()
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  useEffect(() => {
    if (config?.raid) setRaid(config.raid)
  }, [config])

  if (!raid) {
    return (
      <GlassCard className="p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      </GlassCard>
    )
  }

  async function handleSave(): Promise<void> {
    if (!raid || !config) return
    setSaving(true)
    await updateConfig({ ...config, raid })
    setSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  function update(partial: Partial<RaidConfig>): void {
    setRaid((prev) => prev ? { ...prev, ...partial } : prev)
    setSaved(false)
  }

  const isRaidActive = raidState === 'active' || raidState === 'suspected'

  return (
    <GlassCard className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Siren className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-text-primary">Raid Protection</span>
        </div>
        <Switch
          checked={raid.enabled}
          onCheckedChange={(enabled) => update({ enabled })}
        />
      </div>

      {isRaidActive && (
        <div className={`px-3 py-2 text-xs rounded border ${
          raidState === 'active'
            ? 'text-red-400 bg-red-400/10 border-red-400/20'
            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
        }`}>
          Raid {raidState === 'active' ? 'ACTIVE' : 'suspected'} — auto-protections engaged
          <button
            onClick={() => setManualLockdown(false)}
            className="ml-2 underline hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant={isRaidActive ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setManualLockdown(!isRaidActive)}
        >
          {isRaidActive ? 'End Lockdown' : 'Manual Lockdown'}
        </Button>
        <span className="text-[10px] text-text-muted">
          Emergency lockdown — enables all raid protections immediately
        </span>
      </div>

      {raid.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="join-threshold" className="text-xs text-text-secondary">
                Join threshold
              </Label>
              <Input
                id="join-threshold"
                type="number"
                min={3}
                max={100}
                value={raid.joinThreshold}
                onChange={(e) => update({ joinThreshold: parseInt(e.target.value, 10) || 10 })}
                className="mt-1"
              />
              <span className="text-[10px] text-text-muted">Joins to trigger raid alert</span>
            </div>
            <div>
              <Label htmlFor="join-window" className="text-xs text-text-secondary">
                Window (seconds)
              </Label>
              <Input
                id="join-window"
                type="number"
                min={10}
                max={300}
                value={raid.joinWindowSeconds}
                onChange={(e) => update({ joinWindowSeconds: parseInt(e.target.value, 10) || 30 })}
                className="mt-1"
              />
              <span className="text-[10px] text-text-muted">Time window for join counting</span>
            </div>
          </div>

          <div>
            <Label htmlFor="min-age" className="text-xs text-text-secondary">
              Minimum account age (days)
            </Label>
            <Input
              id="min-age"
              type="number"
              min={0}
              max={365}
              value={raid.minAccountAgeDays}
              onChange={(e) => update({ minAccountAgeDays: parseInt(e.target.value, 10) || 7 })}
              className="mt-1 max-w-[200px]"
            />
            <span className="text-[10px] text-text-muted">Accounts newer than this are flagged as suspicious</span>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-text-secondary">Auto-actions on raid detection</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={raid.autoSlowmode}
                  onCheckedChange={(autoSlowmode) => update({ autoSlowmode })}
                />
                <span className="text-xs text-text-primary">Enable slowmode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={raid.autoLockdown}
                  onCheckedChange={(autoLockdown) => update({ autoLockdown })}
                />
                <span className="text-xs text-text-primary">Lock channels (read-only)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={raid.autoBanNewAccounts}
                  onCheckedChange={(autoBanNewAccounts) => update({ autoBanNewAccounts })}
                />
                <span className="text-xs text-text-primary">Auto-ban suspicious new accounts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={raid.notifyOwner}
                  onCheckedChange={(notifyOwner) => update({ notifyOwner })}
                />
                <span className="text-xs text-text-primary">Notify owner via DM</span>
              </label>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || configLoading} size="sm">
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
          {saved ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Saved</> : 'Save'}
        </Button>
      </div>
    </GlassCard>
  )
}
