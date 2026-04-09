import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAuditStore } from '@/stores/audit.store'
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react'
import type { EscalationStep, EscalationActionType, EscalationChainPayload } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

const ACTION_OPTIONS: { value: EscalationActionType; label: string }[] = [
  { value: 'warning', label: 'Warning only' },
  { value: 'mute', label: 'Mute' },
  { value: 'kick', label: 'Kick' },
  { value: 'ban', label: 'Ban' }
]

export function EscalationConfigForm(): React.ReactElement {
  const { chains, chainsLoading, fetchChains, saveChain, deleteChain, toggleChain } = useAuditStore()
  const [editing, setEditing] = useState<(EscalationChainPayload & { id?: number }) | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchChains() }, [])

  function startCreate(): void {
    setEditing({
      name: '',
      platform: 'all',
      steps: [{ warningNumber: 1, action: 'warning', durationMinutes: null }],
      warningExpiryDays: 30,
      enabled: true
    })
  }

  function startEdit(id: number): void {
    const chain = chains.find((c) => c.id === id)
    if (!chain) return
    setEditing({
      id: chain.id,
      name: chain.name,
      platform: chain.platform,
      steps: [...chain.steps],
      warningExpiryDays: chain.warningExpiryDays,
      enabled: chain.enabled
    })
  }

  async function handleSave(): Promise<void> {
    if (!editing || !editing.name.trim()) return
    setSaving(true)
    try {
      await saveChain(editing)
      setEditing(null)
    } catch {
      // Error handled by store
    } finally {
      setSaving(false)
    }
  }

  function updateStep(index: number, updates: Partial<EscalationStep>): void {
    if (!editing) return
    const steps = editing.steps.map((s, i) => i === index ? { ...s, ...updates } : s)
    setEditing({ ...editing, steps })
  }

  function addStep(): void {
    if (!editing) return
    const nextNum = editing.steps.length > 0
      ? Math.max(...editing.steps.map((s) => s.warningNumber)) + 1
      : 1
    setEditing({
      ...editing,
      steps: [...editing.steps, { warningNumber: nextNum, action: 'warning', durationMinutes: null }]
    })
  }

  function removeStep(index: number): void {
    if (!editing) return
    setEditing({ ...editing, steps: editing.steps.filter((_, i) => i !== index) })
  }

  if (chainsLoading && chains.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Escalation Chains</h3>
          <p className="text-xs text-text-muted">Auto-escalate warnings through punishment tiers</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent bg-accent/10 rounded hover:bg-accent/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          New Chain
        </button>
      </div>

      {/* Chain list */}
      {chains.map((chain) => (
        <GlassCard key={chain.id} elevation="surface" className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary">{chain.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-muted">
                {chain.platform}
              </span>
              {chain.warningExpiryDays && (
                <span className="text-[10px] text-text-muted">
                  ({chain.warningExpiryDays}d expiry)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={chain.enabled}
                  onChange={(e) => toggleChain(chain.id, e.target.checked)}
                  className="w-3 h-3"
                />
                <span className="text-[10px] text-text-muted">Enabled</span>
              </label>
              <button
                onClick={() => startEdit(chain.id)}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteChain(chain.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {chain.steps.map((step) => (
              <span
                key={step.warningNumber}
                className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-secondary"
              >
                #{step.warningNumber}: {step.action}
                {step.durationMinutes ? ` (${step.durationMinutes}m)` : ''}
              </span>
            ))}
          </div>
        </GlassCard>
      ))}

      {chains.length === 0 && !editing && (
        <div className="text-center py-8 text-text-muted text-xs">
          No escalation chains configured. Create one to auto-escalate warnings.
        </div>
      )}

      {/* Editor */}
      {editing && (
        <GlassCard elevation="raised" className="p-4 space-y-3 border border-accent/30">
          <h4 className="text-xs font-semibold text-text-primary">
            {editing.id ? 'Edit Chain' : 'New Escalation Chain'}
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-text-muted block mb-1">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
                placeholder="e.g. Default"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted block mb-1">Platform</label>
              <select
                value={editing.platform}
                onChange={(e) => setEditing({ ...editing, platform: e.target.value as Platform | 'all' })}
                className="w-full px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
              >
                <option value="all">All</option>
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-muted block mb-1">Warning Expiry (days)</label>
              <input
                type="number"
                value={editing.warningExpiryDays ?? ''}
                onChange={(e) => setEditing({
                  ...editing,
                  warningExpiryDays: e.target.value ? parseInt(e.target.value, 10) : null
                })}
                className="w-full px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
                placeholder="Never"
                min={1}
              />
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-text-muted font-medium">Steps</label>
              <button
                onClick={addStep}
                className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80"
              >
                <Plus className="w-3 h-3" /> Add step
              </button>
            </div>

            <div className="space-y-1">
              {editing.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 bg-glass-surface rounded p-2">
                  <GripVertical className="w-3 h-3 text-text-muted flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted">Warning #</span>
                    <input
                      type="number"
                      value={step.warningNumber}
                      onChange={(e) => updateStep(i, { warningNumber: parseInt(e.target.value, 10) || 1 })}
                      className="w-10 px-1 py-0.5 text-[10px] bg-glass-surface border border-glass-border rounded text-text-primary text-center"
                      min={1}
                    />
                  </div>
                  <select
                    value={step.action}
                    onChange={(e) => updateStep(i, {
                      action: e.target.value as EscalationActionType,
                      durationMinutes: e.target.value === 'mute' ? (step.durationMinutes ?? 60) : null
                    })}
                    className="px-2 py-0.5 text-[10px] bg-glass-surface border border-glass-border rounded text-text-primary"
                  >
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {step.action === 'mute' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={step.durationMinutes ?? 60}
                        onChange={(e) => updateStep(i, { durationMinutes: parseInt(e.target.value, 10) || 60 })}
                        className="w-14 px-1 py-0.5 text-[10px] bg-glass-surface border border-glass-border rounded text-text-primary text-center"
                        min={1}
                      />
                      <span className="text-[10px] text-text-muted">min</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeStep(i)}
                    className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editing.name.trim() || editing.steps.length === 0}
              className="px-3 py-1 text-xs text-accent bg-accent/10 rounded hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
