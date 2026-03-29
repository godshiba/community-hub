import { useState } from 'react'
import { GlassModal } from '@/components/glass/GlassModal'
import { useModerationStore } from '@/stores/moderation.store'

interface BanDialogProps {
  memberId: number | null
  onClose: () => void
}

export function BanDialog({ memberId, onClose }: BanDialogProps): React.ReactElement | null {
  const { banMember } = useModerationStore()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (!memberId || !reason.trim()) return
    setSubmitting(true)
    try {
      await banMember(memberId, reason.trim())
      setReason('')
      onClose()
    } catch { /* error handled in store */ }
    setSubmitting(false)
  }

  return (
    <GlassModal open={memberId !== null} onClose={onClose}>
      <h3 className="text-sm font-semibold text-red-400 mb-3">Ban Member</h3>
      <p className="text-xs text-text-secondary mb-3">
        This will ban the member on the platform and mark them as banned in the database.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for ban..."
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
          className="px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Banning...' : 'Ban Member'}
        </button>
      </div>
    </GlassModal>
  )
}
