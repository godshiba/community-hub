import type { CSSProperties } from 'react'
import { useModerationStore } from '@/stores/moderation.store'
import { Avatar } from '@/components/ui-native/Avatar'
import { Pill } from '@/components/ui-native/Pill'
import { Button } from '@/components/ui-native/Button'
import { Divider } from '@/components/ui-native/Divider'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { CursorClick } from '@phosphor-icons/react'
import type { MemberStatus } from '@shared/moderation-types'

interface MemberSummaryProps {
  onWarn: (id: number) => void
  onBan: (id: number) => void
  onOpenDetail: () => void
}

const STATUS: Record<MemberStatus, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  warned: { variant: 'warning', label: 'Warned' },
  banned: { variant: 'error',   label: 'Banned' },
  left:   { variant: 'neutral', label: 'Left'   }
}

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)'
}

const KV_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  rowGap: 6,
  columnGap: 12,
  fontSize: 12
}

const KEY: CSSProperties = {
  color: 'var(--color-fg-tertiary)'
}

const VALUE: CSSProperties = {
  color: 'var(--color-fg-primary)',
  fontVariantNumeric: 'tabular-nums'
}

export function MemberSummary({ onWarn, onBan, onOpenDetail }: MemberSummaryProps): React.ReactElement {
  const detail = useModerationStore((s) => s.selectedMember)
  const detailLoading = useModerationStore((s) => s.detailLoading)
  const unbanMember = useModerationStore((s) => s.unbanMember)

  if (detailLoading && !detail) {
    return (
      <div style={{ padding: 'var(--space-4)', fontSize: 12, color: 'var(--color-fg-tertiary)' }}>
        Loading…
      </div>
    )
  }

  if (!detail) {
    return (
      <EmptyState
        size="md"
        icon={<CursorClick size={28} />}
        title="No member selected"
        subtitle="Select a row from the list to inspect their reputation, warnings, and audit history."
      />
    )
  }

  const { member } = detail
  const statusInfo = STATUS[member.status]
  const isBanned = member.status === 'banned'

  return (
    <div style={ROOT}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Avatar name={member.username} size={48} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-fg-primary)' }}>{member.username}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Pill size="sm" variant={member.platform === 'discord' ? 'discord' : 'telegram'}>
              {member.platform === 'discord' ? 'Discord' : 'Telegram'}
            </Pill>
            <Pill size="sm" variant={statusInfo.variant}>{statusInfo.label}</Pill>
          </div>
        </div>
      </div>

      <Divider />

      <div style={KV_GRID}>
        <span style={KEY}>Reputation</span>
        <span style={VALUE}>{member.reputationScore}</span>
        <span style={KEY}>Warnings</span>
        <span style={VALUE}>{member.warningsCount}</span>
        <span style={KEY}>Joined</span>
        <span style={VALUE}>{member.joinDate ?? '—'}</span>
        <span style={KEY}>Last active</span>
        <span style={VALUE}>{member.lastActivity ?? '—'}</span>
        <span style={KEY}>Platform ID</span>
        <span style={{ ...VALUE, fontFamily: 'var(--font-mono)' }}>{member.platformUserId}</span>
      </div>

      <Divider />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {isBanned ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => unbanMember(member.id).catch(() => {/* surfaced via store */})}
          >
            Unban
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => onWarn(member.id)}>Warn…</Button>
            <Button variant="destructive" size="sm" onClick={() => onBan(member.id)}>Ban…</Button>
          </>
        )}
        <Button variant="primary" size="sm" onClick={onOpenDetail} style={{ marginLeft: 'auto' }}>
          Open detail
        </Button>
      </div>

      {detail.warnings.length > 0 && (
        <>
          <Divider />
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-fg-tertiary)', marginBottom: 6 }}>
              Recent warnings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detail.warnings.slice(0, 3).map((w) => (
                <div
                  key={w.id}
                  style={{
                    padding: 8,
                    background: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12
                  }}
                >
                  <div style={{ color: 'var(--color-fg-primary)' }}>{w.reason}</div>
                  <div style={{ color: 'var(--color-fg-tertiary)', fontSize: 11, marginTop: 2 }}>
                    {w.givenBy ? `${w.givenBy} · ` : ''}{new Date(w.givenAt).toLocaleDateString()}
                    {w.resolved ? ' · resolved' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
