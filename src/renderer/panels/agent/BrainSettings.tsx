import { useEffect, useState, useCallback } from 'react'
import { Settings2, Brain, Shield, UserX, MessageSquare, X } from 'lucide-react'
import { useAgentBrainStore } from '@/stores/agent-brain.store'
import { TagInput } from './TagInput'
import { SettingsSection, SliderField, NumberField, ToggleSwitch } from './SettingsFields'
import type { BrainConfig, AgentDecidedActionType } from '@shared/agent-brain-types'

const ACTION_TYPES: readonly { type: AgentDecidedActionType; description: string }[] = [
  { type: 'search_knowledge', description: 'Search the knowledge base for relevant answers' },
  { type: 'lookup_member', description: 'Look up member details and history' },
  { type: 'escalate', description: 'Escalate the issue to a human moderator' },
  { type: 'assign_role', description: 'Assign or modify roles for a member' },
  { type: 'create_reminder', description: 'Create a follow-up reminder' },
  { type: 'tag_moderator', description: 'Tag a specific moderator for attention' }
]

function formatActionName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function BrainSettings(): React.ReactElement {
  const { brainConfig, brainConfigLoading, fetchBrainConfig, updateBrainConfig } = useAgentBrainStore()
  const [draft, setDraft] = useState<BrainConfig | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBrainConfig()
  }, [])

  useEffect(() => {
    if (brainConfig) {
      setDraft({ ...brainConfig, enabledActions: { ...brainConfig.enabledActions } })
    }
  }, [brainConfig])

  const handleSave = useCallback(async (): Promise<void> => {
    if (!draft || !brainConfig) return
    setSaving(true)
    const partial: Partial<BrainConfig> = {}

    if (draft.confidenceThreshold !== brainConfig.confidenceThreshold) partial.confidenceThreshold = draft.confidenceThreshold
    if (draft.maxActionRounds !== brainConfig.maxActionRounds) partial.maxActionRounds = draft.maxActionRounds
    if (draft.maxContextChars !== brainConfig.maxContextChars) partial.maxContextChars = draft.maxContextChars
    if (draft.maxFactsPerUser !== brainConfig.maxFactsPerUser) partial.maxFactsPerUser = draft.maxFactsPerUser
    if (draft.compactionTurnThreshold !== brainConfig.compactionTurnThreshold) partial.compactionTurnThreshold = draft.compactionTurnThreshold
    if (draft.compactionBatchSize !== brainConfig.compactionBatchSize) partial.compactionBatchSize = draft.compactionBatchSize
    if (draft.compactionIntervalHours !== brainConfig.compactionIntervalHours) partial.compactionIntervalHours = draft.compactionIntervalHours
    if (draft.maxSummaryLength !== brainConfig.maxSummaryLength) partial.maxSummaryLength = draft.maxSummaryLength

    const actionsChanged = ACTION_TYPES.some(
      ({ type }) => draft.enabledActions[type] !== brainConfig.enabledActions[type]
    )
    if (actionsChanged) partial.enabledActions = { ...draft.enabledActions }

    if (JSON.stringify(draft.userBlacklist) !== JSON.stringify(brainConfig.userBlacklist)) {
      partial.userBlacklist = draft.userBlacklist
    }
    if (JSON.stringify(draft.customGreetingWords) !== JSON.stringify(brainConfig.customGreetingWords)) {
      partial.customGreetingWords = draft.customGreetingWords
    }
    if (JSON.stringify(draft.customFollowUpPatterns) !== JSON.stringify(brainConfig.customFollowUpPatterns)) {
      partial.customFollowUpPatterns = draft.customFollowUpPatterns
    }

    if (Object.keys(partial).length > 0) {
      await updateBrainConfig(partial)
    }
    setSaving(false)
  }, [draft, brainConfig, updateBrainConfig])

  if (brainConfigLoading || !draft) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-muted">
        Loading brain configuration...
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-y-auto h-full pb-4">
      <SettingsSection icon={Settings2} title="Response Tuning">
        <SliderField
          label="Confidence Threshold"
          value={draft.confidenceThreshold}
          min={0} max={1} step={0.05}
          onChange={(v) => setDraft({ ...draft, confidenceThreshold: v })}
        />
        <NumberField
          label="Max Action Rounds"
          value={draft.maxActionRounds}
          min={1} max={5}
          onChange={(v) => setDraft({ ...draft, maxActionRounds: v })}
        />
        <NumberField
          label="Max Context Budget (chars)"
          value={draft.maxContextChars}
          min={4000} max={20000}
          onChange={(v) => setDraft({ ...draft, maxContextChars: v })}
        />
      </SettingsSection>

      <SettingsSection icon={Brain} title="Memory Settings">
        <NumberField
          label="Max Facts Per User"
          value={draft.maxFactsPerUser}
          min={5} max={50}
          onChange={(v) => setDraft({ ...draft, maxFactsPerUser: v })}
        />
        <NumberField
          label="Compaction Threshold (turns)"
          value={draft.compactionTurnThreshold}
          min={20} max={200}
          onChange={(v) => setDraft({ ...draft, compactionTurnThreshold: v })}
        />
        <NumberField
          label="Compaction Batch Size"
          value={draft.compactionBatchSize}
          min={10} max={100}
          onChange={(v) => setDraft({ ...draft, compactionBatchSize: v })}
        />
        <NumberField
          label="Compaction Interval (hours)"
          value={draft.compactionIntervalHours}
          min={1} max={48}
          onChange={(v) => setDraft({ ...draft, compactionIntervalHours: v })}
        />
        <NumberField
          label="Max Summary Length (chars)"
          value={draft.maxSummaryLength}
          min={500} max={5000}
          onChange={(v) => setDraft({ ...draft, maxSummaryLength: v })}
        />
      </SettingsSection>

      <SettingsSection icon={Shield} title="Action Permissions">
        <div className="space-y-2">
          {ACTION_TYPES.map(({ type, description }) => (
            <div key={type} className="flex items-center justify-between">
              <div>
                <div className="text-xs text-text-primary">{formatActionName(type)}</div>
                <div className="text-[10px] text-text-muted">{description}</div>
              </div>
              <ToggleSwitch
                checked={draft.enabledActions[type]}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    enabledActions: { ...draft.enabledActions, [type]: checked }
                  })
                }
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon={UserX} title="User Blacklist">
        <p className="text-[10px] text-text-muted mb-2">
          Blocked users (format: platform:userId). The agent will not respond to these users.
        </p>
        <BlacklistEditor
          entries={draft.userBlacklist}
          onChange={(entries) => setDraft({ ...draft, userBlacklist: entries })}
        />
      </SettingsSection>

      <SettingsSection icon={MessageSquare} title="Custom Patterns">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-text-secondary mb-1">Custom Greeting Words</div>
            <TagInput
              tags={draft.customGreetingWords}
              onChange={(tags) => setDraft({ ...draft, customGreetingWords: tags })}
              placeholder="Add greeting word..."
            />
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">Custom Follow-up Patterns</div>
            <TagInput
              tags={draft.customFollowUpPatterns}
              onChange={(tags) => setDraft({ ...draft, customFollowUpPatterns: tags })}
              placeholder="Add follow-up pattern..."
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Blacklist Editor
// ---------------------------------------------------------------------------

function BlacklistEditor({
  entries,
  onChange
}: {
  entries: readonly string[]
  onChange: (entries: readonly string[]) => void
}): React.ReactElement {
  const [input, setInput] = useState('')

  const handleAdd = (): void => {
    const trimmed = input.trim()
    if (!trimmed) return
    const parts = trimmed.split(':')
    if (parts.length !== 2 || (parts[0] !== 'discord' && parts[0] !== 'telegram')) return
    if (entries.includes(trimmed)) return
    onChange([...entries, trimmed])
    setInput('')
  }

  const handleRemove = (index: number): void => {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {entries.length > 0 && (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-1 bg-white/[0.03] rounded text-xs text-text-secondary"
            >
              <span>{entry}</span>
              <button
                onClick={() => handleRemove(i)}
                className="text-text-muted hover:text-red-400 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="discord:userId or telegram:userId"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 px-2 py-1 bg-white/[0.03] border border-glass-border rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
