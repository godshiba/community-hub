import { memo, type CSSProperties } from 'react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { Pill } from '@/components/ui-native/Pill'
import { Divider } from '@/components/ui-native/Divider'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import type { ScheduledPost, PostStatus } from '@shared/scheduler-types'

interface PostPreviewProps {
  selectedPostId: number | null
  source: 'queue' | 'history'
}

const STATUS_PILL: Record<PostStatus, { variant: 'neutral' | 'accent' | 'warning' | 'success' | 'error'; label: string }> = {
  draft:     { variant: 'neutral', label: 'Draft'     },
  scheduled: { variant: 'warning', label: 'Scheduled' },
  sending:   { variant: 'accent',  label: 'Sending'   },
  sent:      { variant: 'success', label: 'Sent'      },
  error:     { variant: 'error',   label: 'Error'     }
}

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)'
}

const TITLE: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-fg-primary)'
}

const PLATFORM_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)',
  marginBottom: 6
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function PlatformCard({
  platform, title, content
}: { platform: 'discord' | 'telegram'; title: string; content: string }): React.ReactElement {
  const accent = platform === 'discord' ? 'var(--color-discord)' : 'var(--color-telegram)'
  return (
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: `1px solid color-mix(in oklch, ${accent} 30%, transparent)`,
        borderRadius: 'var(--radius-md)',
        padding: 12
      }}
    >
      <div style={PLATFORM_LABEL}>{platform === 'discord' ? 'Discord' : 'Telegram'}</div>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-primary)', marginBottom: 4 }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-fg-secondary)', whiteSpace: 'pre-wrap' }}>
        {content || '—'}
      </div>
    </div>
  )
}

export const PostPreview = memo(function PostPreview({ selectedPostId, source }: PostPreviewProps): React.ReactElement {
  const queue   = useSchedulerStore((s) => s.queue)
  const history = useSchedulerStore((s) => s.history)

  if (selectedPostId == null) {
    return (
      <EmptyState
        size="md"
        icon={<PaperPlaneTilt size={28} />}
        title="No post selected"
        subtitle="Pick a post from the queue or history to preview how it will render on each platform."
      />
    )
  }

  if (source === 'queue') {
    const post = queue.find((p: ScheduledPost) => p.id === selectedPostId)
    if (!post) return <EmptyState size="md" title="Post no longer in queue" />
    const statusInfo = STATUS_PILL[post.status]
    return (
      <div style={ROOT}>
        <div>
          <div style={TITLE}>{post.title || `Post #${post.id}`}</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pill size="sm" variant={statusInfo.variant}>{statusInfo.label}</Pill>
            {post.scheduledTime && (
              <span style={{ fontSize: 12, color: 'var(--color-fg-tertiary)' }}>
                {formatTime(post.scheduledTime)}
              </span>
            )}
          </div>
        </div>
        <Divider />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {post.platforms.map((p) => (
            <PlatformCard key={p} platform={p} title={post.title ?? ''} content={post.content} />
          ))}
        </div>
      </div>
    )
  }

  const entry = history.find((h) => h.id === selectedPostId)
  if (!entry) return <EmptyState size="md" title="History entry not found" />
  return (
    <div style={ROOT}>
      <div>
        <div style={TITLE}>Post #{entry.postId}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill size="sm" variant={entry.platform === 'discord' ? 'discord' : 'telegram'}>
            {entry.platform === 'discord' ? 'Discord' : 'Telegram'}
          </Pill>
          <Pill size="sm" variant={entry.success ? 'success' : 'error'}>
            {entry.success ? 'Sent' : 'Failed'}
          </Pill>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-fg-tertiary)' }}>
          {formatTime(entry.sentAt)}
        </div>
      </div>
      {entry.errorText && (
        <>
          <Divider />
          <div>
            <div style={PLATFORM_LABEL}>Error</div>
            <div style={{ fontSize: 12, color: 'var(--color-error)' }}>{entry.errorText}</div>
          </div>
        </>
      )}
    </div>
  )
})
