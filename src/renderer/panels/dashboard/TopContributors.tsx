import { memo, type CSSProperties } from 'react'
import { Users } from '@phosphor-icons/react'
import { Surface } from '@/components/ui-native/Surface'
import { ListRow } from '@/components/ui-native/ListRow'
import { Avatar } from '@/components/ui-native/Avatar'
import { Pill } from '@/components/ui-native/Pill'
import { EmptyState } from '@/components/ui-native/EmptyState'
import type { Contributor } from '@shared/analytics-types'

interface TopContributorsProps {
  data: readonly Contributor[]
}

const CARD: CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
}

const TITLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-fg-primary)',
  margin: 0
}

const RANK: CSSProperties = {
  width: 22,
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-fg-tertiary)',
  textAlign: 'right'
}

const SCORE: CSSProperties = {
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-accent)',
  fontWeight: 500,
  minWidth: 36,
  textAlign: 'right'
}

const COUNT: CSSProperties = {
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-fg-secondary)',
  minWidth: 64,
  textAlign: 'right'
}

export const TopContributors = memo(function TopContributors({ data }: TopContributorsProps): React.ReactElement {
  return (
    <Surface variant="raised" radius="lg" bordered style={CARD}>
      <h3 style={TITLE}>Top Contributors</h3>
      {data.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Users size={28} />}
          title="No contributors yet"
          subtitle="Contributor data will appear after the moderation module syncs members."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data.map((c, i) => (
            <ListRow
              key={c.id}
              density="compact"
              interactive={false}
              leading={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={RANK}>{i + 1}</span>
                  <Avatar src={c.avatar} name={c.name} size={22} />
                </span>
              }
              title={c.name}
              trailing={
                <>
                  <Pill size="sm" variant={c.platform === 'discord' ? 'discord' : 'telegram'}>
                    {c.platform === 'discord' ? 'Discord' : 'Telegram'}
                  </Pill>
                  <span style={COUNT} title={`${c.messageCount.toLocaleString()} messages`}>
                    {c.messageCount.toLocaleString()}
                  </span>
                  <span style={SCORE}>{c.score}</span>
                </>
              }
            />
          ))}
        </div>
      )}
    </Surface>
  )
})
