import { useState, type CSSProperties } from 'react'
import { useModerationStore } from '@/stores/moderation.store'
import { Button } from '@/components/ui-native/Button'
import { Sheet } from '@/components/ui-native/Sheet'
import { TextArea } from '@/components/ui-native/TextArea'
import { Pill } from '@/components/ui-native/Pill'
import { Surface } from '@/components/ui-native/Surface'
import type { BulkActionResult } from '@shared/moderation-types'

type BulkAction = 'warn' | 'ban' | 'kick' | null

const BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingInline: 'var(--space-3)',
  paddingBlock: 'var(--space-2)',
  marginBottom: 'var(--space-2)'
}

export function BulkActionToolbar(): React.ReactElement | null {
  const selectedIds = useModerationStore((s) => s.selectedIds)
  const clearSelection = useModerationStore((s) => s.clearSelection)
  const bulkWarn = useModerationStore((s) => s.bulkWarn)
  const bulkBan = useModerationStore((s) => s.bulkBan)
  const bulkKick = useModerationStore((s) => s.bulkKick)
  const bulkLoading = useModerationStore((s) => s.bulkLoading)
  const exportSelectedCsv = useModerationStore((s) => s.exportSelectedCsv)

  const [activeAction, setActiveAction] = useState<BulkAction>(null)
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<BulkActionResult | null>(null)
  const [actionCount, setActionCount] = useState(0)

  if (selectedIds.size === 0 && activeAction === null && result === null) return null

  const count = selectedIds.size || actionCount

  function close(): void {
    setActiveAction(null)
    setReason('')
    setResult(null)
    setActionCount(0)
  }

  async function confirm(): Promise<void> {
    if (!activeAction || !reason.trim()) return
    setActionCount(selectedIds.size)
    try {
      const fn = activeAction === 'warn' ? bulkWarn : activeAction === 'ban' ? bulkBan : bulkKick
      const res = await fn(reason.trim())
      setResult(res)
    } catch {
      // surfaced via store error
    }
  }

  function exportCsv(): void {
    const csv = exportSelectedCsv()
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members-export-${count}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }

  const actionLabel = activeAction === 'warn' ? 'Warn' : activeAction === 'ban' ? 'Ban' : 'Kick'

  return (
    <>
      <Surface variant="raised" radius="md" bordered style={BAR}>
        <Pill variant="accent" size="md">{count} selected</Pill>
        <Button size="sm" variant="secondary" onClick={() => setActiveAction('warn')} disabled={bulkLoading}>Bulk warn…</Button>
        <Button size="sm" variant="secondary" onClick={() => setActiveAction('kick')} disabled={bulkLoading}>Bulk kick…</Button>
        <Button size="sm" variant="destructive" onClick={() => setActiveAction('ban')} disabled={bulkLoading}>Bulk ban…</Button>
        <Button size="sm" variant="plain" onClick={exportCsv}>Export CSV</Button>
        <Button size="sm" variant="plain" onClick={clearSelection} style={{ marginLeft: 'auto' }}>Clear</Button>
      </Surface>

      <Sheet
        open={activeAction !== null && result === null}
        onOpenChange={(open) => { if (!open) close() }}
        title={`${actionLabel} ${count} member${count === 1 ? '' : 's'}`}
        description={`This action will be applied to all ${count} selected member${count === 1 ? '' : 's'} and logged in the audit trail.`}
        width="sm"
        footer={
          <>
            <Button variant="plain" onClick={close}>Cancel</Button>
            <Button
              variant={activeAction === 'ban' ? 'destructive' : 'primary'}
              onClick={confirm}
              isLoading={bulkLoading}
              disabled={!reason.trim()}
            >
              {`${actionLabel} ${count} member${count === 1 ? '' : 's'}`}
            </Button>
          </>
        }
      >
        <TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (required)…"
          rows={3}
          autoFocus
          aria-label="Reason"
        />
      </Sheet>

      <Sheet
        open={result !== null}
        onOpenChange={(open) => { if (!open) close() }}
        title="Bulk action complete"
        width="sm"
        footer={<Button variant="primary" onClick={close}>Done</Button>}
      >
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ color: 'var(--color-success)' }}>{result.succeeded} succeeded</div>
            {result.failed > 0 && <div style={{ color: 'var(--color-error)' }}>{result.failed} failed</div>}
            {result.errors.length > 0 && (
              <div
                style={{
                  marginTop: 6,
                  maxHeight: 160,
                  overflowY: 'auto',
                  fontSize: 12,
                  color: 'var(--color-fg-tertiary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {result.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  )
}
