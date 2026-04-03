import { useState, useEffect, useRef } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import type { AiConfig, AiProvider } from '@shared/settings-types'

const PROVIDERS: Array<{ id: AiProvider; label: string; defaultModel: string }> = [
  { id: 'grok', label: 'Grok', defaultModel: 'grok-3' },
  { id: 'claude', label: 'Claude', defaultModel: 'claude-sonnet-4-20250514' },
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { id: 'gemini', label: 'Gemini', defaultModel: 'gemini-2.5-flash' }
]

export function AiProviderForm(): React.ReactElement {
  const [config, setConfig] = useState<AiConfig>({
    provider: null,
    apiKey: '',
    model: '',
    temperature: 0.7
  })
  const [keyVisible, setKeyVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadConfig()
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
  }, [])

  async function loadConfig(): Promise<void> {
    const result = await window.api.invoke('settings:loadAiConfig')
    if (result.success) {
      setConfig(result.data)
    }
  }

  function handleProviderChange(value: string): void {
    const provider = value as AiProvider
    const defaultModel = PROVIDERS.find((p) => p.id === provider)?.defaultModel ?? ''
    setConfig((prev) => ({
      ...prev,
      provider,
      model: prev.model || defaultModel
    }))
    setSaved(false)
  }

  async function handleSave(): Promise<void> {
    setSaving(true)
    const result = await window.api.invoke('settings:saveAiConfig', config)
    if (result.success) {
      setSaved(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <div>
        <Label className="text-xs text-text-secondary">Provider</Label>
        <Select value={config.provider ?? ''} onValueChange={handleProviderChange}>
          <SelectTrigger className="mt-1 bg-obsidian/50 border-glass-border">
            <SelectValue placeholder="Select AI provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ai-key" className="text-xs text-text-secondary">
          API Key
        </Label>
        <div className="relative mt-1">
          <Input
            id="ai-key"
            type={keyVisible ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => {
              setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              setSaved(false)
            }}
            placeholder="sk-..."
            className="bg-obsidian/50 border-glass-border pr-9"
          />
          <button
            type="button"
            onClick={() => setKeyVisible(!keyVisible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            {keyVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="ai-model" className="text-xs text-text-secondary">
          Model
        </Label>
        <Input
          id="ai-model"
          value={config.model}
          onChange={(e) => {
            setConfig((prev) => ({ ...prev, model: e.target.value }))
            setSaved(false)
          }}
          placeholder="Model name"
          className="mt-1 bg-obsidian/50 border-glass-border"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-text-secondary">Temperature</Label>
          <span className="text-xs text-text-muted">{config.temperature.toFixed(1)}</span>
        </div>
        <Slider
          value={[config.temperature]}
          onValueChange={([value]) => {
            setConfig((prev) => ({ ...prev, temperature: value }))
            setSaved(false)
          }}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !config.provider}>
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
