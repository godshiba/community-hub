import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useContentModerationStore } from '@/stores/content-moderation.store'
import { Loader2 } from 'lucide-react'
import type {
  ContentCategory,
  ContentActionType,
  CategoryPolicy,
  ClassificationMode,
  ModerationPolicyPayload
} from '@shared/content-moderation-types'
import { DEFAULT_CATEGORY_POLICIES } from '@shared/content-moderation-types'

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  clean: 'Clean',
  toxic: 'Toxic',
  nsfw_text: 'NSFW Text',
  spam: 'Spam',
  scam: 'Scam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  self_harm: 'Self-Harm'
}

const ACTION_OPTIONS: { value: ContentActionType; label: string }[] = [
  { value: 'ignore', label: 'Ignore' },
  { value: 'flag', label: 'Flag for review' },
  { value: 'delete', label: 'Delete message' },
  { value: 'warn', label: 'Warn user' },
  { value: 'mute', label: 'Mute user' },
  { value: 'ban', label: 'Ban user' }
]

const EDITABLE_CATEGORIES: ContentCategory[] = [
  'toxic', 'nsfw_text', 'spam', 'scam', 'harassment', 'hate_speech', 'self_harm'
]

export function ContentPolicyForm(): React.ReactElement {
  const { policy, policyLoading, fetchPolicy, savePolicy } = useContentModerationStore()
  const [enabled, setEnabled] = useState(false)
  const [testMode, setTestMode] = useState(true)
  const [classificationMode, setClassificationMode] = useState<ClassificationMode>('suspicious')
  const [categories, setCategories] = useState<CategoryPolicy[]>([...DEFAULT_CATEGORY_POLICIES])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchPolicy() }, [])

  useEffect(() => {
    if (policy) {
      setEnabled(policy.enabled)
      setTestMode(policy.testMode)
      setClassificationMode(policy.classificationMode)
      setCategories([...policy.categories])
    }
  }, [policy])

  const updateCategory = (category: ContentCategory, field: 'threshold' | 'action', value: number | string) => {
    setCategories((prev) =>
      prev.map((cp) =>
        cp.category === category
          ? { ...cp, [field]: field === 'threshold' ? Number(value) : value }
          : cp
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: ModerationPolicyPayload & { id?: number } = {
        id: policy?.id,
        name: policy?.name ?? 'Default Policy',
        enabled,
        platform: 'all',
        classificationMode,
        testMode,
        categories
      }
      await savePolicy(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
    setSaving(false)
  }

  if (policyLoading && !policy) {
    return (
      <GlassCard elevation="raised" className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-text-secondary">Loading policy...</span>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard elevation="raised" className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">AI Content Moderation</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Use AI to classify and moderate messages in real-time
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-text-secondary">{enabled ? 'Enabled' : 'Disabled'}</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-accent"
          />
        </label>
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Classification mode</label>
              <select
                value={classificationMode}
                onChange={(e) => setClassificationMode(e.target.value as ClassificationMode)}
                className="w-full text-xs bg-glass-surface border border-glass rounded px-2 py-1.5 text-text-primary"
              >
                <option value="suspicious">Suspicious only (heuristic pre-filter)</option>
                <option value="all">All messages</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Test mode</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-xs text-text-secondary">
                  Flag only, do not execute actions
                </span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-primary mb-2">Per-category thresholds</h4>
            <div className="space-y-2">
              {EDITABLE_CATEGORIES.map((cat) => {
                const catPolicy = categories.find((c) => c.category === cat)
                const threshold = catPolicy?.threshold ?? 0.7
                const action = catPolicy?.action ?? 'flag'
                return (
                  <div key={cat} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-text-secondary">{CATEGORY_LABELS[cat]}</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(threshold * 100)}
                        onChange={(e) => updateCategory(cat, 'threshold', Number(e.target.value) / 100)}
                        className="flex-1 h-1 accent-accent"
                      />
                      <span className="w-8 text-right text-text-muted">
                        {Math.round(threshold * 100)}%
                      </span>
                    </div>
                    <select
                      value={action}
                      onChange={(e) => updateCategory(cat, 'action', e.target.value)}
                      className="text-xs bg-glass-surface border border-glass rounded px-2 py-1 text-text-primary w-32"
                    >
                      {ACTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </GlassCard>
  )
}
