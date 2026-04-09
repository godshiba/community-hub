import { useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { GlassModal } from '@/components/glass/GlassModal'
import { useModerationStore } from '@/stores/moderation.store'
import type { BulkActionResult } from '@shared/moderation-types'

type BulkAction = 'warn' | 'ban' | 'kick' | null

export function BulkActionToolbar(): React.ReactElement | null {
  const { selectedIds, clearSelection, bulkWarn, bulkBan, bulkKick, bulkLoading, exportSelectedCsv } = useModerationStore()
  const [activeAction, setActiveAction] = useState<BulkAction>(null)
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<BulkActionResult | null>(null)

  if (selectedIds.size === 0) return null

  const count = selectedIds.size

  function closeDialog(): void {
    setActiveAction(null)
    setReason('')
    setResult(null)
  }

  async function handleConfirm(): Promise<void> {
    if (!activeAction || !reason.trim()) return

    try {
      let res: BulkActionResult
      if (activeAction === 'warn') {
        res = await bulkWarn(reason.trim())
      } else if (activeAction === 'ban') {
        res = await bulkBan(reason.trim())
      } else {
        res = await bulkKick(reason.trim())
      }
      setResult(res)
    } catch {
      // Error handled in store
    }
  }

  function handleExport(): void {
    const csv = exportSelectedCsv()
    if (!csv) return

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-export-${count}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const actionLabels: Record<string, { label: string; color: string; bg: string }> = {
    warn: { label: 'Warn', color: 'text-yellow-400', bg: 'bg-yellow-400/20 hover:bg-yellow-400/30' },
    ban: { label: 'Ban', color: 'text-red-400', bg: 'bg-red-400/20 hover:bg-red-400/30' },
    kick: { label: 'Kick', color: 'text-orange-400', bg: 'bg-orange-400/20 hover:bg-orange-400/30' }
  }

  return (
    <>
      <GlassCard className="px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-accent font-medium">{count} selected</span>
        <div className="h-4 w-px bg-glass-border" />

        <button
          onClick={() => setActiveAction('warn')}
          disabled={bulkLoading}
          className="px-2 py-1 text-xs text-yellow-400 bg-yellow-400/10 rounded hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
        >
          Bulk Warn
        </button>
        <button
          onClick={() => setActiveAction('kick')}
          disabled={bulkLoading}
          className="px-2 py-1 text-xs text-orange-400 bg-orange-400/10 rounded hover:bg-orange-400/20 transition-colors disabled:opacity-50"
        >
          Bulk Kick
        </button>
        <button
          onClick={() => setActiveAction('ban')}
          disabled={bulkLoading}
          className="px-2 py-1 text-xs text-red-400 bg-red-400/10 rounded hover:bg-red-400/20 transition-colors disabled:opacity-50"
        >
          Bulk Ban
        </button>

        <div className="h-4 w-px bg-glass-border" />

        <button
          onClick={handleExport}
          className="px-2 py-1 text-xs text-text-secondary bg-glass-surface rounded hover:bg-white/10 transition-colors"
        >
          Export CSV
        </button>

        <button
          onClick={clearSelection}
          className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors ml-auto"
        >
          Clear
        </button>
      </GlassCard>

      {/* Confirmation dialog */}
      <GlassModal open={activeAction !== null && result === null} onClose={closeDialog}>
        {activeAction && (
          <>
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              <span className={actionLabels[activeAction].color}>{actionLabels[activeAction].label}</span>{' '}
              {count} member{count !== 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-text-muted mb-3">
              This action will be applied to all {count} selected members and logged individually in the audit trail.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (required)..."
              className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={closeDialog}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim() || bulkLoading}
                className={`px-3 py-1.5 text-xs font-medium ${actionLabels[activeAction].color} ${actionLabels[activeAction].bg} rounded transition-colors disabled:opacity-50`}
              >
                {bulkLoading ? 'Processing...' : `${actionLabels[activeAction].label} ${count} Members`}
              </button>
            </div>
          </>
        )}
      </GlassModal>

      {/* Result dialog */}
      <GlassModal open={result !== null} onClose={closeDialog}>
        {result && (
          <>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Bulk Action Complete</h3>
            <div className="space-y-1 text-xs">
              <p className="text-green-400">{result.succeeded} succeeded</p>
              {result.failed > 0 && <p className="text-red-400">{result.failed} failed</p>}
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-text-muted">{e}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={closeDialog}
                className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </GlassModal>
    </>
  )
}
