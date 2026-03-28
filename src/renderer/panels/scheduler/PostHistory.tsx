import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { CheckCircle, XCircle, History } from 'lucide-react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import type { PostHistoryEntry } from '@shared/scheduler-types'

function formatTime(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const PostHistory = memo(function PostHistory(): React.ReactElement {
  const { history } = useSchedulerStore()

  if (history.length === 0) {
    return (
      <GlassCard className="p-4">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <History className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No send history yet</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4 space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[60px_80px_1fr_140px] gap-2 text-xs text-text-muted pb-2 border-b border-glass-border">
        <span>Post</span>
        <span>Platform</span>
        <span>Result</span>
        <span>Sent At</span>
      </div>

      {/* Rows */}
      {history.map((entry: PostHistoryEntry) => (
        <div
          key={entry.id}
          className="grid grid-cols-[60px_80px_1fr_140px] gap-2 text-xs items-center py-1.5 border-b border-glass-border/30"
        >
          <span className="text-text-muted">#{entry.postId}</span>

          <span
            className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${
              entry.platform === 'discord' ? 'bg-discord/20 text-discord' : 'bg-telegram/20 text-telegram'
            }`}
          >
            {entry.platform === 'discord' ? 'Discord' : 'Telegram'}
          </span>

          <div className="flex items-center gap-1.5">
            {entry.success
              ? <CheckCircle className="size-3 text-success" />
              : <XCircle className="size-3 text-error" />}
            <span className={entry.success ? 'text-success' : 'text-error'}>
              {entry.success ? 'Sent' : entry.errorText ?? 'Failed'}
            </span>
          </div>

          <span className="text-text-secondary">{formatTime(entry.sentAt)}</span>
        </div>
      ))}
    </GlassCard>
  )
})
