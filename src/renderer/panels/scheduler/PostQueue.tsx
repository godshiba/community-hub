import { memo, type CSSProperties } from 'react'
import { Article, PaperPlaneTilt, X } from '@phosphor-icons/react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { Surface } from '@/components/ui-native/Surface'
import { ListRow } from '@/components/ui-native/ListRow'
import { Pill } from '@/components/ui-native/Pill'
import { ContextMenu } from '@/components/ui-native/ContextMenu'
import { EmptyState } from '@/components/ui-native/EmptyState'
import type { ContextMenuNode } from '@/components/ui-native/ContextMenu'
import type { PostStatus, ScheduledPost } from '@shared/scheduler-types'

interface PostQueueProps {
  selectedId: number | null
  onSelect: (id: number) => void
}

const STATUS_PILL: Record<PostStatus, { variant: 'neutral' | 'accent' | 'warning' | 'success' | 'error'; label: string }> = {
  draft:     { variant: 'neutral', label: 'Draft'     },
  scheduled: { variant: 'warning', label: 'Scheduled' },
  sending:   { variant: 'accent',  label: 'Sending'   },
  sent:      { variant: 'success', label: 'Sent'      },
  error:     { variant: 'error',   label: 'Error'     }
}

const TRAILING: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
  color: 'var(--color-fg-tertiary)'
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const PostQueue = memo(function PostQueue({ selectedId, onSelect }: PostQueueProps): React.ReactElement {
  const queue      = useSchedulerStore((s) => s.queue)
  const cancelPost = useSchedulerStore((s) => s.cancelPost)
  const sendNow    = useSchedulerStore((s) => s.sendNow)
  const loading    = useSchedulerStore((s) => s.loading)

  if (queue.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <EmptyState
          size="md"
          icon={<Article size={40} />}
          title="No posts in queue"
          subtitle="Use New Post in the toolbar to draft, schedule, or send."
        />
      </Surface>
    )
  }

  return (
    <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {queue.map((post: ScheduledPost) => {
        const statusInfo = STATUS_PILL[post.status]
        const canAct = post.status === 'draft' || post.status === 'scheduled'
        const items: ContextMenuNode[] = [
          ...(canAct
            ? [
                { id: 'send',   label: 'Send now', onSelect: () => { void sendNow(post.id) }, disabled: loading } as ContextMenuNode,
                { id: 'cancel', label: 'Cancel',   destructive: true, onSelect: () => { void cancelPost(post.id) } } as ContextMenuNode
              ]
            : [
                { id: 'noop', label: 'No actions available', disabled: true, onSelect: () => {} } as ContextMenuNode
              ])
        ]
        return (
          <ContextMenu
            key={post.id}
            items={items}
            trigger={
              <ListRow
                density="comfortable"
                selected={selectedId === post.id}
                onSelect={() => onSelect(post.id)}
                title={post.title || post.content.slice(0, 80)}
                subtitle={formatTime(post.scheduledTime)}
                trailing={
                  <span style={TRAILING}>
                    {post.platforms.map((p) => (
                      <Pill key={p} size="sm" variant={p === 'discord' ? 'discord' : 'telegram'}>
                        {p === 'discord' ? 'DC' : 'TG'}
                      </Pill>
                    ))}
                    <Pill size="sm" variant={statusInfo.variant}>{statusInfo.label}</Pill>
                    {canAct && (
                      <span
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', gap: 2 }}
                      >
                        <button
                          aria-label="Send now"
                          title="Send now"
                          disabled={loading}
                          onClick={() => { void sendNow(post.id) }}
                          className="ui-native-button ui-native-button--icon"
                          style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'var(--color-fg-tertiary)' }}
                        >
                          <PaperPlaneTilt size={12} />
                        </button>
                        <button
                          aria-label="Cancel"
                          title="Cancel"
                          onClick={() => { void cancelPost(post.id) }}
                          className="ui-native-button ui-native-button--icon"
                          style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: 'var(--color-error)' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </span>
                }
              />
            }
          />
        )
      })}
    </Surface>
  )
})
