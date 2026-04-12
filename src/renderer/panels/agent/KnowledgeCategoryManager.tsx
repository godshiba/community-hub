import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Badge } from '@/components/shared/Badge'
import type { KnowledgeCategory, KnowledgeCategoryPayload } from '@shared/knowledge-types'

interface KnowledgeCategoryManagerProps {
  categories: readonly KnowledgeCategory[]
  selectedId: number | undefined
  onSelect: (id: number | undefined) => void
  onCreate: (payload: KnowledgeCategoryPayload) => void
  onUpdate: (id: number, payload: KnowledgeCategoryPayload) => void
  onDelete: (id: number) => void
}

export function KnowledgeCategoryManager({
  categories,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete
}: KnowledgeCategoryManagerProps): React.ReactElement {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(0)

  const startEdit = (cat: KnowledgeCategory): void => {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setPriority(cat.priority)
    setShowForm(true)
  }

  const resetForm = (): void => {
    setEditingId(null)
    setName('')
    setDescription('')
    setPriority(0)
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return

    const payload: KnowledgeCategoryPayload = {
      name: name.trim(),
      description: description.trim() || null,
      priority
    }

    if (editingId) {
      onUpdate(editingId, payload)
    } else {
      onCreate(payload)
    }
    resetForm()
  }

  return (
    <GlassCard className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-text-secondary">Categories</h4>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
          title="Add category"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 pb-2 border-b border-glass-border">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
            required
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Priority:</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-16 px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <div className="flex-1" />
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-0.5">
        <button
          onClick={() => onSelect(undefined)}
          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
            selectedId === undefined
              ? 'bg-accent/15 text-accent'
              : 'text-text-secondary hover:bg-white/[0.04]'
          }`}
        >
          All entries
        </button>

        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`group flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
              selectedId === cat.id
                ? 'bg-accent/15 text-accent'
                : 'text-text-secondary hover:bg-white/[0.04]'
            }`}
          >
            <button
              onClick={() => onSelect(cat.id)}
              className="flex-1 text-left text-xs truncate"
            >
              {cat.name}
            </button>
            <Badge variant="muted" className="text-[10px]">
              {cat.entryCount}
            </Badge>
            <button
              onClick={() => startEdit(cat)}
              className="p-0.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-secondary transition-all"
              title="Edit category"
            >
              <Pencil className="size-3" />
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="p-0.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all"
              title="Delete category"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
