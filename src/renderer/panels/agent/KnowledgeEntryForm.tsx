import { useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import type { KnowledgeEntryPayload, KnowledgeEntry, KnowledgeCategory } from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'

interface KnowledgeEntryFormProps {
  entry?: KnowledgeEntry | null
  categories: readonly KnowledgeCategory[]
  onSave: (payload: KnowledgeEntryPayload) => void
  onCancel: () => void
}

const PLATFORM_OPTIONS: Array<{ value: Platform | ''; label: string }> = [
  { value: '', label: 'All platforms' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' }
]

export function KnowledgeEntryForm({
  entry,
  categories,
  onSave,
  onCancel
}: KnowledgeEntryFormProps): React.ReactElement {
  const [title, setTitle] = useState(entry?.title ?? '')
  const [content, setContent] = useState(entry?.content ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(entry?.categoryId ?? null)
  const [tags, setTags] = useState(entry?.tags.join(', ') ?? '')
  const [platformScope, setPlatformScope] = useState<Platform | ''>(
    entry?.platformScope ?? ''
  )

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    onSave({
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId || null,
      tags: parsedTags,
      platformScope: platformScope || null
    })
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <h4 className="text-sm font-medium text-text-primary">
        {entry ? 'Edit Entry' : 'New Knowledge Entry'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-text-muted block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., How to reset password"
            className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
            required
          />
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The knowledge content that the agent will reference when answering questions..."
            rows={6}
            className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 resize-y"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Category</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Platform</label>
            <select
              value={platformScope}
              onChange={(e) =>
                setPlatformScope(e.target.value as Platform | '')
              }
              className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="faq, billing, support"
              className="w-full px-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim()}
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {entry ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </GlassCard>
  )
}
