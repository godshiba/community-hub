import { memo, type CSSProperties } from 'react'
import { ArrowsCounterClockwise, CheckCircle, XCircle } from '@phosphor-icons/react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { Surface } from '@/components/ui-native/Surface'
import { ListRow } from '@/components/ui-native/ListRow'
import { Pill } from '@/components/ui-native/Pill'
import { EmptyState } from '@/components/ui-native/EmptyState'
import type { PostHistoryEntry } from '@shared/scheduler-types'

interface PostHistoryProps {
  selectedId: number | null
  onSelect: (id: number) => void
}

const TRAILING: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: 'var(--color-fg-tertiary)'
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const PostHistory = memo(function PostHistory({ selectedId, onSelect }: PostHistoryProps): React.ReactElement {
  const history = useSchedulerStore((s) => s.history)

  if (history.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <EmptyState
          size="md"
          icon={<ArrowsCounterClockwise size={40} />}
          title="No send history yet"
          subtitle="Posts you send will appear here once delivery has been attempted."
        />
      </Surface>
    )
  }

  return (
    <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {history.map((entry: PostHistoryEntry) => (
        <ListRow
          key={entry.id}
          density="comfortable"
          selected={selectedId === entry.id}
          onSelect={() => onSelect(entry.id)}
          leading={entry.success
            ? <CheckCircle size={16} weight="fill" color="var(--color-success)" />
            : <XCircle size={16} weight="fill" color="var(--color-error)" />}
          title={`Post #${entry.postId}`}
          subtitle={entry.success ? 'Delivered' : (entry.errorText ?? 'Failed')}
          trailing={
            <span style={TRAILING}>
              <Pill size="sm" variant={entry.platform === 'discord' ? 'discord' : 'telegram'}>
                {entry.platform === 'discord' ? 'Discord' : 'Telegram'}
              </Pill>
              <span>{formatTime(entry.sentAt)}</span>
            </span>
          }
        />
      ))}
    </Surface>
  )
})
