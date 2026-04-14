import { useState, useEffect } from 'react'
import { GlassModal } from '@/components/glass/GlassModal'
import { useModerationStore } from '@/stores/moderation.store'

interface WarningDialogProps {
  memberId: number | null
  onClose: () => void
}

export function WarningDialog({ memberId, onClose }: WarningDialogProps): React.ReactElement | null {
  const { warnMember } = useModerationStore()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset reason when dialog opens for a new member
  useEffect(() => {
    if (memberId !== null) setReason('')
  }, [memberId])

  async function handleSubmit(): Promise<void> {
    if (!memberId || !reason.trim()) return
    setSubmitting(true)
    try {
      await warnMember(memberId, reason.trim())
      setReason('')
      onClose()
    } catch { /* error handled in store */ }
    setSubmitting(false)
  }

  return (
    <GlassModal open={memberId !== null} onClose={onClose}>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Warn Member</h3>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for warning..."
        className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted resize-none"
        rows={3}
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!reason.trim() || submitting}
          className="px-3 py-1.5 text-xs font-medium bg-yellow-400/20 text-yellow-400 rounded hover:bg-yellow-400/30 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Warning...' : 'Warn'}
        </button>
      </div>
    </GlassModal>
  )
}
