import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAgentStore } from '@/stores/agent.store'
import type { AgentProfilePayload, AgentRespondMode } from '@shared/agent-types'

export function AgentProfileEditor(): React.ReactElement {
  const { profile, fetchProfile, updateProfile } = useAgentStore()
  const [form, setForm] = useState<AgentProfilePayload>({
    name: '',
    role: '',
    tone: '',
    knowledge: '',
    boundaries: '',
    language: 'en',
    respondMode: 'mentioned'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        role: profile.role ?? '',
        tone: profile.tone ?? '',
        knowledge: profile.knowledge ?? '',
        boundaries: profile.boundaries ?? '',
        language: profile.language,
        respondMode: profile.respondMode ?? 'mentioned'
      })
    }
  }, [profile])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-text-primary">Agent Profile</h3>
      <p className="text-xs text-text-muted">
        Define the agent's identity, tone, and knowledge for all AI interactions
      </p>

      <div className="space-y-2">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Community Bot" />
        <Field label="Role" value={form.role ?? ''} onChange={(v) => setForm({ ...form, role: v })} placeholder="Community Manager" />
        <Field label="Tone" value={form.tone ?? ''} onChange={(v) => setForm({ ...form, tone: v })} placeholder="friendly, professional" />
        <Field label="Language" value={form.language ?? 'en'} onChange={(v) => setForm({ ...form, language: v })} placeholder="en" />

        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Respond Mode</label>
          <select
            value={form.respondMode ?? 'mentioned'}
            onChange={(e) => setForm({ ...form, respondMode: e.target.value as AgentRespondMode })}
            className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
          >
            <option value="mentioned">When mentioned (by name or @bot)</option>
            <option value="always">Always respond to all messages</option>
            <option value="never">Never (automation rules only)</option>
          </select>
          <p className="text-[10px] text-text-muted">
            Controls when the AI responds via the conversation engine. Automation rules always run regardless.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Knowledge Base</label>
          <textarea
            value={form.knowledge ?? ''}
            onChange={(e) => setForm({ ...form, knowledge: e.target.value })}
            placeholder="Project FAQ, rules, links, common Q&A pairs..."
            className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent/50"
            rows={4}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Boundaries</label>
          <textarea
            value={form.boundaries ?? ''}
            onChange={(e) => setForm({ ...form, boundaries: e.target.value })}
            placeholder="What the agent can/cannot do, escalation conditions..."
            className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent/50"
            rows={3}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !form.name}
        className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </GlassCard>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function Field({ label, value, onChange, placeholder }: FieldProps): React.ReactElement {
  return (
    <div className="space-y-1">
      <label className="text-xs text-text-secondary">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-glass-surface border border-glass-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50"
      />
    </div>
  )
}
