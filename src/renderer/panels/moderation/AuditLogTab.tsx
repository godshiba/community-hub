import { useEffect } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAuditStore } from '@/stores/audit.store'
import { Loader2, ScrollText, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AuditActionType } from '@shared/moderation-types'

const ACTION_LABELS: Record<AuditActionType, string> = {
  warn: 'Warning',
  mute: 'Mute',
  kick: 'Kick',
  ban: 'Ban',
  unban: 'Unban',
  note: 'Note',
  spam_detection: 'Spam',
  raid_action: 'Raid'
}

const ACTION_COLORS: Record<AuditActionType, string> = {
  warn: 'text-yellow-400 bg-yellow-400/10',
  mute: 'text-blue-400 bg-blue-400/10',
  kick: 'text-orange-400 bg-orange-400/10',
  ban: 'text-red-500 bg-red-500/10',
  unban: 'text-green-400 bg-green-400/10',
  note: 'text-text-secondary bg-glass-surface',
  spam_detection: 'text-purple-400 bg-purple-400/10',
  raid_action: 'text-red-400 bg-red-400/10'
}

const ALL_ACTIONS: AuditActionType[] = [
  'warn', 'mute', 'kick', 'ban', 'unban', 'note', 'spam_detection', 'raid_action'
]

export function AuditLogTab(): React.ReactElement {
  const {
    entries, total, loading, error, offset, limit,
    actionType, platform, targetUsername,
    setActionType, setPlatform, setTargetUsername, setOffset,
    fetchAuditLog, exportCsv
  } = useAuditStore()

  useEffect(() => { fetchAuditLog() }, [])

  async function handleExport(): Promise<void> {
    const csv = await exportCsv()
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={actionType ?? ''}
          onChange={(e) => setActionType((e.target.value || undefined) as AuditActionType | undefined)}
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
        >
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>

        <select
          value={platform ?? ''}
          onChange={(e) => setPlatform((e.target.value || undefined) as 'discord' | 'telegram' | undefined)}
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
        >
          <option value="">All platforms</option>
          <option value="discord">Discord</option>
          <option value="telegram">Telegram</option>
        </select>

        <input
          type="text"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          placeholder="Search member..."
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted w-36"
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">{total} entries</span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 text-xs text-accent bg-accent/10 rounded hover:bg-accent/20 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && entries.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <ScrollText className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">No audit entries found</span>
          <span className="text-xs mt-1">Moderation actions will be logged here automatically</span>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <div className="space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto">
          {entries.map((entry) => (
            <GlassCard key={entry.id} elevation="surface" className="p-2.5 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ACTION_COLORS[entry.actionType]}`}>
                    {ACTION_LABELS[entry.actionType]}
                  </span>
                  <span className="text-xs font-medium text-text-primary truncate">
                    {entry.targetUsername}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-muted">
                    {entry.platform}
                  </span>
                </div>
                {entry.reason && (
                  <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[500px]">
                    {entry.reason}
                  </p>
                )}
                <p className="text-[10px] text-text-muted mt-0.5">
                  by {entry.moderator} ({entry.moderatorType})
                </p>
              </div>
              <span className="text-[10px] text-text-muted whitespace-nowrap">
                {formatTimestamp(entry.timestamp)}
              </span>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={page <= 1}
            className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={page >= totalPages}
            className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso + 'Z')
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}
