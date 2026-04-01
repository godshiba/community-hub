import { useEffect, useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAgentStore } from '@/stores/agent.store'
import type { AgentAutomationPayload, TriggerType, AutomationActionType } from '@shared/agent-types'

const TRIGGER_TYPES: TriggerType[] = ['keyword', 'new_member', 'regex', 'schedule', 'inactivity']
const ACTION_TYPES: AutomationActionType[] = ['reply', 'dm', 'post', 'moderate', 'escalate']

export function AutomationRules(): React.ReactElement {
  const { automations, fetchAutomations, saveAutomation, deleteAutomation, toggleAutomation } = useAgentStore()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchAutomations() }, [])

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">Automation Rules</h3>
          <p className="text-xs text-text-muted">Event-driven rules for automated agent actions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors"
          title="Add rule"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {showForm && (
        <NewRuleForm
          onSave={(payload) => {
            saveAutomation(payload)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-1.5">
        {automations.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-3">No automation rules configured</p>
        ) : (
          automations.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-2 px-2.5 py-2 bg-white/[0.02] rounded text-xs"
            >
              <button
                onClick={() => toggleAutomation(rule.id, !rule.enabled)}
                className={rule.enabled ? 'text-green-400' : 'text-text-muted'}
              >
                {rule.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary font-medium">{rule.name}</span>
                <span className="text-text-muted ml-2">
                  {rule.trigger.type}: {rule.trigger.value || '(any)'}
                </span>
                <span className="text-text-muted ml-2">
                  {' -> '}{rule.action.type}
                </span>
              </div>
              {rule.platform && (
                <span className="text-[10px] text-text-muted">{rule.platform}</span>
              )}
              <button
                onClick={() => deleteAutomation(rule.id)}
                className="p-1 text-text-muted hover:text-red-400 transition-colors"
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

interface NewRuleFormProps {
  onSave: (payload: AgentAutomationPayload) => void
  onCancel: () => void
}

function NewRuleForm({ onSave, onCancel }: NewRuleFormProps): React.ReactElement {
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('keyword')
  const [triggerValue, setTriggerValue] = useState('')
  const [actionType, setActionType] = useState<AutomationActionType>('reply')

  const handleSubmit = (): void => {
    if (!name) return
    onSave({
      name,
      trigger: { type: triggerType, value: triggerValue },
      action: { type: actionType }
    })
  }

  return (
    <div className="p-3 bg-white/[0.03] border border-glass-border rounded space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Rule name"
        className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
      />

      <div className="flex gap-2">
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value as TriggerType)}
          className="bg-glass-surface border border-glass-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none"
        >
          {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <input
          type="text"
          value={triggerValue}
          onChange={(e) => setTriggerValue(e.target.value)}
          placeholder="Trigger value"
          className="flex-1 bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
        />
      </div>

      <select
        value={actionType}
        onChange={(e) => setActionType(e.target.value as AutomationActionType)}
        className="bg-glass-surface border border-glass-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none"
      >
        {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <div className="flex gap-1">
        <button
          onClick={handleSubmit}
          disabled={!name}
          className="px-2.5 py-1 text-[11px] font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          Save Rule
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
