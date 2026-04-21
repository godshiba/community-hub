import { useState } from 'react'
import { X, Plus, Pencil, Check } from 'lucide-react'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Fact Editor — inline fact list with add/remove
// ---------------------------------------------------------------------------

interface FactEditorProps {
  facts: readonly string[]
  platform: Platform
  userId: string
  onUpdate: (platform: Platform, userId: string, facts: readonly string[]) => Promise<void>
}

export function FactEditor({ facts, platform, userId, onUpdate }: FactEditorProps): React.ReactElement {
  const [newFact, setNewFact] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRemove = async (index: number): Promise<void> => {
    setSaving(true)
    const updated = facts.filter((_, i) => i !== index)
    await onUpdate(platform, userId, updated)
    setSaving(false)
  }

  const handleAdd = async (): Promise<void> => {
    const trimmed = newFact.trim()
    if (!trimmed) return
    setSaving(true)
    const updated = [...facts, trimmed]
    await onUpdate(platform, userId, updated)
    setNewFact('')
    setSaving(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {facts.map((fact, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] rounded group"
          >
            {fact}
            <button
              onClick={() => handleRemove(i)}
              disabled={saving}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-accent/60 hover:text-red-400"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Add fact..."
          value={newFact}
          onChange={(e) => setNewFact(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={saving}
          className="flex-1 px-2 py-1 bg-white/[0.03] border border-glass-border rounded text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newFact.trim()}
          className="px-2 py-1 bg-accent/10 text-accent text-[10px] rounded hover:bg-accent/20 transition-colors disabled:opacity-40"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary Editor — inline editable summary with save/cancel
// ---------------------------------------------------------------------------

interface SummaryEditorProps {
  summary: string | null
  platform: Platform
  userId: string
  onUpdate: (platform: Platform, userId: string, summary: string) => Promise<void>
}

export function SummaryEditor({ summary, platform, userId, onUpdate }: SummaryEditorProps): React.ReactElement {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(summary ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    await onUpdate(platform, userId, draft)
    setEditing(false)
    setSaving(false)
  }

  const handleCancel = (): void => {
    setDraft(summary ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full px-2 py-1.5 bg-white/[0.03] border border-glass-border rounded text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
        />
        <div className="flex gap-1 justify-end">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-2 py-0.5 bg-white/5 text-text-muted text-[10px] rounded hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded hover:bg-accent/20"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-1">
      <div className="flex-1 text-[10px] text-text-muted bg-white/[0.03] rounded p-2">
        <span className="font-medium text-text-secondary">Summary: </span>
        {summary ?? 'No summary yet'}
      </div>
      <button
        onClick={() => { setDraft(summary ?? ''); setEditing(true) }}
        className="shrink-0 p-1 text-text-muted hover:text-accent transition-colors"
        title="Edit summary"
      >
        <Pencil className="size-3" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Memory Stats Bar
// ---------------------------------------------------------------------------

interface MemoryStatsBarProps {
  totalUsers: number
  totalTurns: number
  averageTurnsPerUser: number
  onCompact: () => Promise<void>
  compacting: boolean
  compactResult: number | null
}

export function MemoryStatsBar({
  totalUsers,
  totalTurns,
  averageTurnsPerUser,
  onCompact,
  compacting,
  compactResult
}: MemoryStatsBarProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-glass-surface border border-glass-border rounded text-[10px]">
      <div className="flex items-center gap-1 text-text-secondary">
        <span className="font-medium text-text-primary">{totalUsers}</span> users
      </div>
      <div className="w-px h-3 bg-glass-border" />
      <div className="flex items-center gap-1 text-text-secondary">
        <span className="font-medium text-text-primary">{totalTurns}</span> turns
      </div>
      <div className="w-px h-3 bg-glass-border" />
      <div className="flex items-center gap-1 text-text-secondary">
        <span className="font-medium text-text-primary">{averageTurnsPerUser.toFixed(1)}</span> avg/user
      </div>
      <div className="ml-auto flex items-center gap-2">
        {compactResult !== null && (
          <span className="text-green-400">{compactResult} compacted</span>
        )}
        <button
          onClick={onCompact}
          disabled={compacting}
          className="px-2 py-0.5 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors disabled:opacity-40"
        >
          {compacting ? 'Compacting...' : 'Compact Now'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Turn Selection Bar (floating)
// ---------------------------------------------------------------------------

interface TurnSelectionBarProps {
  count: number
  onDelete: () => void
  onClear: () => void
  deleting: boolean
}

export function TurnSelectionBar({ count, onDelete, onClear, deleting }: TurnSelectionBarProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-red-400/10 border border-red-400/20 rounded text-[10px]">
      <span className="text-text-secondary">
        <span className="font-medium text-text-primary">{count}</span> turn{count !== 1 ? 's' : ''} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onClear}
          disabled={deleting}
          className="px-2 py-0.5 bg-white/5 text-text-muted rounded hover:bg-white/10"
        >
          Clear
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="px-2 py-0.5 bg-red-400/10 text-red-400 rounded hover:bg-red-400/20 disabled:opacity-40"
        >
          {deleting ? 'Deleting...' : `Delete ${count} turn${count !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
