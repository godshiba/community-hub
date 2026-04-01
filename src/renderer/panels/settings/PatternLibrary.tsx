import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAgentStore } from '@/stores/agent.store'
import type { AgentPatternPayload, PatternTriggerType } from '@shared/agent-types'

const TRIGGER_TYPES: PatternTriggerType[] = ['keyword', 'regex', 'intent']

export function PatternLibrary(): React.ReactElement {
  const { patterns, fetchPatterns, savePattern, deletePattern } = useAgentStore()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchPatterns() }, [])

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">Pattern Library</h3>
          <p className="text-xs text-text-muted">Reusable response templates for consistent replies</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors"
          title="Add pattern"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {showForm && (
        <NewPatternForm
          onSave={(payload) => {
            savePattern(payload)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-1.5">
        {patterns.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-3">No patterns configured</p>
        ) : (
          patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="flex items-start gap-2 px-2.5 py-2 bg-white/[0.02] rounded text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted">{pattern.triggerType}:</span>
                  <span className="text-text-primary font-medium">{pattern.triggerValue}</span>
                  {pattern.platform && (
                    <span className="text-[10px] text-text-muted">({pattern.platform})</span>
                  )}
                  <span className="text-[10px] text-text-muted ml-auto">
                    used {pattern.usageCount}x
                  </span>
                </div>
                <p className="text-text-secondary mt-0.5 truncate">{pattern.responseTemplate}</p>
              </div>
              <button
                onClick={() => deletePattern(pattern.id)}
                className="p-1 text-text-muted hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  )
}

interface NewPatternFormProps {
  onSave: (payload: AgentPatternPayload) => void
  onCancel: () => void
}

function NewPatternForm({ onSave, onCancel }: NewPatternFormProps): React.ReactElement {
  const [triggerType, setTriggerType] = useState<PatternTriggerType>('keyword')
  const [triggerValue, setTriggerValue] = useState('')
  const [responseTemplate, setResponseTemplate] = useState('')

  const handleSubmit = (): void => {
    if (!triggerValue || !responseTemplate) return
    onSave({ triggerType, triggerValue, responseTemplate })
  }

  return (
    <div className="p-3 bg-white/[0.03] border border-glass-border rounded space-y-2">
      <div className="flex gap-2">
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value as PatternTriggerType)}
          className="bg-glass-surface border border-glass-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none"
        >
          {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <input
          type="text"
          value={triggerValue}
          onChange={(e) => setTriggerValue(e.target.value)}
          placeholder="Trigger value (e.g. 'pricing')"
          className="flex-1 bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
        />
      </div>

      <textarea
        value={responseTemplate}
        onChange={(e) => setResponseTemplate(e.target.value)}
        placeholder="Response template..."
        className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent/50"
        rows={3}
      />

      <div className="flex gap-1">
        <button
          onClick={handleSubmit}
          disabled={!triggerValue || !responseTemplate}
          className="px-2.5 py-1 text-[11px] font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          Save Pattern
        </button>
        <button
          onClick={onCancel}
          className="px-2.5 py-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
