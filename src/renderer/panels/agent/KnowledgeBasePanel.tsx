import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Upload, Trash2, Pencil, BookOpen, Tag } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/shared/Badge'
import { GlassModal } from '@/components/glass/GlassModal'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import { KnowledgeEntryForm } from './KnowledgeEntryForm'
import { KnowledgeCategoryManager } from './KnowledgeCategoryManager'
import type { KnowledgeEntry, KnowledgeEntryPayload } from '@shared/knowledge-types'

export function KnowledgeBasePanel(): React.ReactElement {
  const {
    entries,
    entriesLoading,
    categories,
    searchResults,
    searchQuery,
    searchLoading,
    filterCategoryId,
    fetchEntries,
    fetchCategories,
    createEntry,
    updateEntry,
    deleteEntry,
    importEntries,
    search,
    clearSearch,
    createCategory,
    updateCategory,
    deleteCategory,
    setFilterCategoryId
  } = useKnowledgeStore()

  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    fetchEntries()
    fetchCategories()
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value)
      if (value.trim().length >= 2) {
        search(value)
      } else if (!value.trim()) {
        clearSearch()
      }
    },
    [search, clearSearch]
  )

  const handleSave = (payload: KnowledgeEntryPayload): void => {
    if (editingEntry) {
      updateEntry(editingEntry.id, payload)
    } else {
      createEntry(payload)
    }
    setShowForm(false)
    setEditingEntry(null)
  }

  const handleEdit = (entry: KnowledgeEntry): void => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleImport = async (): Promise<void> => {
    if (!importText.trim()) return

    // Parse markdown-style entries: # Title\nContent\n\n# Title\nContent
    const sections = importText.split(/^#{1,3}\s+/m).filter(Boolean)
    const parsed = sections.map((section) => {
      const lines = section.trim().split('\n')
      const title = lines[0]?.trim() ?? 'Untitled'
      const content = lines.slice(1).join('\n').trim()
      return { title, content }
    }).filter((e) => e.content.length > 0)

    if (parsed.length === 0) {
      setImportResult('No valid entries found. Use markdown headings (# Title) to separate entries.')
      return
    }

    const result = await importEntries(parsed)
    setImportResult(`Imported ${result.imported} entries. ${result.failed > 0 ? `${result.failed} failed.` : ''}`)
    if (result.imported > 0) {
      setImportText('')
    }
  }

  const displayEntries = searchQuery.trim()
    ? searchResults.map((r) => r.entry)
    : entries

  return (
    <div className="flex gap-3 h-full min-h-0">
      {/* Left sidebar — Categories */}
      <div className="w-48 shrink-0 overflow-y-auto">
        <KnowledgeCategoryManager
          categories={categories}
          selectedId={filterCategoryId}
          onSelect={setFilterCategoryId}
          onCreate={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 gap-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="p-1.5 text-text-muted hover:text-text-secondary hover:bg-white/[0.04] rounded transition-colors"
            title="Bulk import"
          >
            <Upload className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditingEntry(null)
              setShowForm(true)
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            <Plus className="size-3.5" />
            Add Entry
          </button>
        </div>

        {/* Entry form (inline) */}
        {showForm && (
          <KnowledgeEntryForm
            entry={editingEntry}
            categories={categories}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false)
              setEditingEntry(null)
            }}
          />
        )}

        {/* Search info bar */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border border-accent/15 rounded text-xs">
            <span className="text-text-muted">
              {searchLoading
                ? 'Searching...'
                : `${searchResults.length} results for "${searchQuery}"`}
            </span>
            <button
              onClick={() => {
                setLocalSearch('')
                clearSearch()
              }}
              className="text-accent hover:underline ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {entriesLoading && displayEntries.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">Loading...</p>
          ) : displayEntries.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No knowledge entries yet"
              description="Add entries to give the agent reference material for answering questions"
              action={{
                label: 'Add first entry',
                onClick: () => {
                  setEditingEntry(null)
                  setShowForm(true)
                }
              }}
            />
          ) : (
            displayEntries.map((entry) => (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => handleEdit(entry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Import modal */}
      <GlassModal open={showImport} onClose={() => setShowImport(false)}>
        <h3 className="text-sm font-medium text-text-primary mb-3">Bulk Import</h3>
        <p className="text-xs text-text-muted mb-3">
          Paste markdown content. Use headings (# Title) to separate entries.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={"# Server Rules\nBe respectful to all members...\n\n# How to get roles\nVisit #roles channel and react..."}
          rows={12}
          className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 resize-y mb-3 font-mono"
        />
        {importResult && (
          <p className="text-xs text-accent mb-3">{importResult}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowImport(false)
              setImportResult(null)
            }}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-40"
          >
            Import
          </button>
        </div>
      </GlassModal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Entry Card
// ---------------------------------------------------------------------------

function KnowledgeEntryCard({
  entry,
  onEdit,
  onDelete
}: {
  entry: KnowledgeEntry
  onEdit: () => void
  onDelete: () => void
}): React.ReactElement {
  return (
    <GlassCard className="group px-3 py-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-text-primary truncate">
            {entry.title}
          </h4>
          <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
            {entry.content}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 text-text-muted hover:text-text-secondary rounded transition-colors"
            title="Edit"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-text-muted hover:text-error rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {entry.categoryName && (
          <Badge variant="info">{entry.categoryName}</Badge>
        )}
        {entry.platformScope && (
          <Badge
            variant={
              entry.platformScope === 'discord'
                ? 'platform-discord'
                : 'platform-telegram'
            }
          >
            {entry.platformScope}
          </Badge>
        )}
        {entry.tags.length > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
            <Tag className="size-2.5" />
            {entry.tags.join(', ')}
          </span>
        )}
        {entry.usageCount > 0 && (
          <span className="text-[10px] text-text-muted ml-auto">
            cited {entry.usageCount}x
          </span>
        )}
      </div>
    </GlassCard>
  )
}
