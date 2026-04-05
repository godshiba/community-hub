import { useEffect, useState, useRef } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle2, Shield } from 'lucide-react'
import { useSpamStore } from '@/stores/spam.store'
import type { FloodConfig } from '@shared/spam-types'

export function SpamProtectionForm(): React.ReactElement {
  const { config, configLoading, fetchConfig, updateConfig } = useSpamStore()
  const [flood, setFlood] = useState<FloodConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchConfig()
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  useEffect(() => {
    if (config?.flood) setFlood(config.flood)
  }, [config])

  if (!flood) {
    return (
      <GlassCard className="p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      </GlassCard>
    )
  }

  async function handleSave(): Promise<void> {
    if (!flood || !config) return
    setSaving(true)
    await updateConfig({ ...config, flood })
    setSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  function update(partial: Partial<FloodConfig>): void {
    setFlood((prev) => prev ? { ...prev, ...partial } : prev)
    setSaved(false)
  }

  return (
    <GlassCard className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-text-primary">Anti-Spam Protection</span>
        </div>
        <Switch
          checked={flood.enabled}
          onCheckedChange={(enabled) => update({ enabled })}
        />
      </div>

      {flood.enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rate-limit" className="text-xs text-text-secondary">
                Message rate limit
              </Label>
              <Input
                id="rate-limit"
                type="number"
                min={2}
                max={30}
                value={flood.messageRateLimit}
                onChange={(e) => update({ messageRateLimit: parseInt(e.target.value, 10) || 5 })}
                className="mt-1"
              />
              <span className="text-[10px] text-text-muted">Max messages per window</span>
            </div>
            <div>
              <Label htmlFor="rate-window" className="text-xs text-text-secondary">
                Window (seconds)
              </Label>
              <Input
                id="rate-window"
                type="number"
                min={5}
                max={120}
                value={flood.messageRateWindowSeconds}
                onChange={(e) => update({ messageRateWindowSeconds: parseInt(e.target.value, 10) || 10 })}
                className="mt-1"
              />
              <span className="text-[10px] text-text-muted">Time window for rate limit</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dupe-threshold" className="text-xs text-text-secondary">
                Duplicate similarity (%)
              </Label>
              <Input
                id="dupe-threshold"
                type="number"
                min={50}
                max={100}
                value={flood.duplicateSimilarityThreshold}
                onChange={(e) => update({ duplicateSimilarityThreshold: parseInt(e.target.value, 10) || 80 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-links" className="text-xs text-text-secondary">
                Max links per message
              </Label>
              <Input
                id="max-links"
                type="number"
                min={0}
                max={20}
                value={flood.maxLinksPerMessage}
                onChange={(e) => update({ maxLinksPerMessage: parseInt(e.target.value, 10) || 3 })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-mentions" className="text-xs text-text-secondary">
                Max mentions per message
              </Label>
              <Input
                id="max-mentions"
                type="number"
                min={1}
                max={50}
                value={flood.maxMentionsPerMessage}
                onChange={(e) => update({ maxMentionsPerMessage: parseInt(e.target.value, 10) || 5 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-emoji" className="text-xs text-text-secondary">
                Max emoji per message
              </Label>
              <Input
                id="max-emoji"
                type="number"
                min={1}
                max={100}
                value={flood.maxEmojiPerMessage}
                onChange={(e) => update({ maxEmojiPerMessage: parseInt(e.target.value, 10) || 15 })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-caps" className="text-xs text-text-secondary">
                Max caps (%)
              </Label>
              <Input
                id="max-caps"
                type="number"
                min={30}
                max={100}
                value={flood.maxCapsPercent}
                onChange={(e) => update({ maxCapsPercent: parseInt(e.target.value, 10) || 70 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mute-duration" className="text-xs text-text-secondary">
                Default mute (minutes)
              </Label>
              <Input
                id="mute-duration"
                type="number"
                min={1}
                max={1440}
                value={flood.defaultMuteDurationMinutes}
                onChange={(e) => update({ defaultMuteDurationMinutes: parseInt(e.target.value, 10) || 10 })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-text-secondary">Default action</Label>
            <div className="flex gap-2 mt-1">
              {(['delete', 'warn', 'mute', 'kick', 'ban'] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => update({ defaultAction: action })}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    flood.defaultAction === action
                      ? 'bg-accent/30 text-accent border border-accent/40'
                      : 'bg-glass-surface text-text-secondary border border-glass hover:border-accent/30'
                  }`}
                >
                  {action}
                </button>
              ))}
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
