import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Send, X, Clock, FileText } from 'lucide-react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import type { ScheduledPost, PostStatus } from '@shared/scheduler-types'

const STATUS_STYLES: Record<PostStatus, string> = {
  draft: 'text-text-muted',
  scheduled: 'text-warning',
  sending: 'text-accent animate-pulse',
  sent: 'text-success',
  error: 'text-error'
}

function formatTime(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const PostQueue = memo(function PostQueue(): React.ReactElement {
  const { queue, cancelPost, sendNow, loading } = useSchedulerStore()

  if (queue.length === 0) {
    return (
      <GlassCard className="p-4">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <FileText className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No posts in queue</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4 space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_140px_80px_100px] gap-2 text-xs text-text-muted pb-2 border-b border-glass-border">
        <span>Title / Content</span>
        <span>Platforms</span>
        <span>Scheduled</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {/* Rows */}
      {queue.map((post: ScheduledPost) => (
        <div
          key={post.id}
          className="grid grid-cols-[1fr_100px_140px_80px_100px] gap-2 text-xs items-center py-1.5 border-b border-glass-border/30"
        >
          <div className="truncate text-text-primary">
            {post.title || post.content.slice(0, 60)}
          </div>

          <div className="flex gap-1">
            {post.platforms.map((p) => (
              <span
                key={p}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  p === 'discord' ? 'bg-discord/20 text-discord' : 'bg-telegram/20 text-telegram'
                }`}
              >
                {p === 'discord' ? 'DC' : 'TG'}
              </span>
            ))}
          </div>

          <span className="text-text-secondary">{formatTime(post.scheduledTime)}</span>

          <span className={STATUS_STYLES[post.status]}>{post.status}</span>

          <div className="flex gap-1 justify-end">
            {(post.status === 'draft' || post.status === 'scheduled') && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => sendNow(post.id)}
                  disabled={loading}
                  title="Send Now"
                >
                  <Send className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-error hover:text-error"
                  onClick={() => cancelPost(post.id)}
                  title="Cancel"
                >
                  <X className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </GlassCard>
  )
})
