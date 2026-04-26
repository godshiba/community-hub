import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useDebounce } from '@/hooks/useDebounce'
import { useModerationStore } from '@/stores/moderation.store'
import { TextField } from '@/components/ui-native/TextField'
import { Select } from '@/components/ui-native/Select'
import { Checkbox } from '@/components/ui-native/Checkbox'
import { ListRow } from '@/components/ui-native/ListRow'
import { Avatar } from '@/components/ui-native/Avatar'
import { Pill } from '@/components/ui-native/Pill'
import { ContextMenu } from '@/components/ui-native/ContextMenu'
import { Button } from '@/components/ui-native/Button'
import { Skeleton } from '@/components/ui-native/Skeleton'
import { EmptyState } from '@/components/ui-native/EmptyState'
import type { ContextMenuNode } from '@/components/ui-native/ContextMenu'
import type { CommunityMember, MemberStatus } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

interface MembersListProps {
  onWarn: (id: number) => void
  onBan: (id: number) => void
  onOpenDetail: () => void
}

const STATUS_PILL: Record<MemberStatus, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  warned: { variant: 'warning', label: 'Warned' },
  banned: { variant: 'error',   label: 'Banned' },
  left:   { variant: 'neutral', label: 'Left'   }
}

const FILTER_BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingBlock: 'var(--space-2)'
}

const COUNT_LABEL: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-fg-tertiary)',
  fontVariantNumeric: 'tabular-nums',
  marginLeft: 'auto'
}

const ROW_HEIGHT = 52

const PLATFORM_OPTIONS = [
  { value: 'all',       label: 'All platforms' },
  { value: 'discord',   label: 'Discord' },
  { value: 'telegram',  label: 'Telegram' }
] as const

const STATUS_OPTIONS = [
  { value: 'all',     label: 'All status' },
  { value: 'active',  label: 'Active' },
  { value: 'warned',  label: 'Warned' },
  { value: 'banned',  label: 'Banned' },
  { value: 'left',    label: 'Left' }
] as const

export function MembersList({ onWarn, onBan, onOpenDetail }: MembersListProps): React.ReactElement {
  const members        = useModerationStore((s) => s.members)
  const total          = useModerationStore((s) => s.total)
  const loading        = useModerationStore((s) => s.loading)
  const platform       = useModerationStore((s) => s.platform)
  const status         = useModerationStore((s) => s.status)
  const search         = useModerationStore((s) => s.search)
  const setPlatform    = useModerationStore((s) => s.setPlatform)
  const setStatus      = useModerationStore((s) => s.setStatus)
  const setSearch      = useModerationStore((s) => s.setSearch)
  const fetchDetail    = useModerationStore((s) => s.fetchMemberDetail)
  const selectedIds    = useModerationStore((s) => s.selectedIds)
  const toggleSelect   = useModerationStore((s) => s.toggleSelect)
  const selectAll      = useModerationStore((s) => s.selectAll)
  const clearSelection = useModerationStore((s) => s.clearSelection)
  const unbanMember    = useModerationStore((s) => s.unbanMember)
  const selectedMember = useModerationStore((s) => s.selectedMember)

  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    if (debouncedSearch !== search) setSearch(debouncedSearch)
  }, [debouncedSearch, search, setSearch])

  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onFocus = (): void => searchInputRef.current?.focus()
    const onSelectAll = (): void => selectAll()
    const onDeselectAll = (): void => clearSelection()
    const onOpenDetailEvent = (): void => {
      if (selectedMember) onOpenDetail()
    }
    window.addEventListener('panel:focusSearch', onFocus)
    window.addEventListener('panel:selectAll', onSelectAll)
    window.addEventListener('panel:deselectAll', onDeselectAll)
    window.addEventListener('panel:openDetail', onOpenDetailEvent)
    return () => {
      window.removeEventListener('panel:focusSearch', onFocus)
      window.removeEventListener('panel:selectAll', onSelectAll)
      window.removeEventListener('panel:deselectAll', onDeselectAll)
      window.removeEventListener('panel:openDetail', onOpenDetailEvent)
    }
  }, [selectAll, clearSelection, selectedMember, onOpenDetail])

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12
  })

  const allSelected = useMemo(
    () => members.length > 0 && members.every((m) => selectedIds.has(m.id)),
    [members, selectedIds]
  )
  const headerChecked: boolean | 'indeterminate' = allSelected
    ? true
    : selectedIds.size > 0
      ? 'indeterminate'
      : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={FILTER_BAR}>
        <TextField
          ref={searchInputRef}
          inputSize="sm"
          placeholder="Search members…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          prefix={<MagnifyingGlass size={12} />}
          containerStyle={{ width: 240, flex: '0 0 240px' }}
          fullWidth={false}
          aria-label="Search members"
        />
        <Select
          size="sm"
          ariaLabel="Platform filter"
          value={platform ?? 'all'}
          onChange={(v) => setPlatform(v === 'all' ? undefined : (v as Platform))}
          options={PLATFORM_OPTIONS}
        />
        <Select
          size="sm"
          ariaLabel="Status filter"
          value={status ?? 'all'}
          onChange={(v) => setStatus(v === 'all' ? undefined : (v as MemberStatus))}
          options={STATUS_OPTIONS}
        />
        <span style={COUNT_LABEL}>{total.toLocaleString()} {total === 1 ? 'member' : 'members'}</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          paddingInline: 'var(--space-2)',
          paddingBlock: 6,
          borderBottom: '1px solid var(--color-divider)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-fg-tertiary)'
        }}
      >
        <span style={{ width: 16 }}>
          <Checkbox
            checked={headerChecked}
            onChange={() => (allSelected ? clearSelection() : selectAll())}
            label={undefined}
          />
        </span>
        <span style={{ flex: 1 }}>Member</span>
        <span style={{ width: 80, textAlign: 'right' }}>Reputation</span>
        <span style={{ width: 60, textAlign: 'right' }}>Warns</span>
        <span style={{ width: 80, textAlign: 'right' }}>Status</span>
      </div>

      <div ref={parentRef} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {loading && members.length === 0 ? (
          <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height={44} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            size="md"
            title="No members yet"
            subtitle={search || platform || status
              ? 'Try clearing filters to see all members.'
              : 'Click Sync Members in the toolbar to import from Discord and Telegram.'}
          />
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const m = members[vi.index]
              if (!m) return null
              return (
                <div
                  key={m.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${vi.start}px)`,
                    height: ROW_HEIGHT
                  }}
                >
                  <MemberRow
                    member={m}
                    selected={selectedIds.has(m.id)}
                    isActive={selectedMember?.member.id === m.id}
                    onSelectRow={() => fetchDetail(m.id)}
                    onToggleCheck={() => toggleSelect(m.id)}
                    onWarn={() => onWarn(m.id)}
                    onBan={() => onBan(m.id)}
                    onUnban={() => unbanMember(m.id).catch(() => {/* surfaced via store */})}
                    onOpenDetail={() => { fetchDetail(m.id); onOpenDetail() }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface MemberRowProps {
  member: CommunityMember
  selected: boolean
  isActive: boolean
  onSelectRow: () => void
  onToggleCheck: () => void
  onWarn: () => void
  onBan: () => void
  onUnban: () => void
  onOpenDetail: () => void
}

function MemberRow({
  member, selected, isActive, onSelectRow, onToggleCheck, onWarn, onBan, onUnban, onOpenDetail
}: MemberRowProps): React.ReactElement {
  const statusInfo = STATUS_PILL[member.status]
  const isBanned = member.status === 'banned'

  const items: ContextMenuNode[] = [
    { id: 'open',  label: 'Open detail', shortcut: ['⌘', '↵'], onSelect: onOpenDetail },
    { type: 'separator', id: 's1' },
    ...(isBanned
      ? [{ id: 'unban', label: 'Unban', onSelect: onUnban } as ContextMenuNode]
      : [
          { id: 'warn', label: 'Warn…', onSelect: onWarn } as ContextMenuNode,
          { id: 'ban',  label: 'Ban…',  destructive: true, onSelect: onBan } as ContextMenuNode
        ]),
    { type: 'separator', id: 's2' },
    {
      id: 'copy-id',
      label: 'Copy platform ID',
      onSelect: () => { void navigator.clipboard.writeText(member.platformUserId) }
    }
  ]

  return (
    <ContextMenu
      items={items}
      trigger={
        <ListRow
          density="comfortable"
          selected={isActive}
          onSelect={onSelectRow}
          style={{
            background: selected
              ? 'color-mix(in oklch, var(--color-accent) 8%, transparent)'
              : isActive
                ? 'var(--color-accent-fill)'
                : undefined
          }}
          leading={
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox checked={selected} onChange={onToggleCheck} />
              <Avatar name={member.username} size={28} />
            </span>
          }
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span>{member.username}</span>
              <Pill size="sm" variant={member.platform === 'discord' ? 'discord' : 'telegram'}>
                {member.platform === 'discord' ? 'Discord' : 'Telegram'}
              </Pill>
            </span>
          }
          subtitle={member.platformUserId}
          trailing={
            <>
              <span style={{ width: 80, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, color: 'var(--color-fg-secondary)' }}>
                {member.reputationScore}
              </span>
              <span style={{ width: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, color: 'var(--color-fg-secondary)' }}>
                {member.warningsCount}
              </span>
              <span style={{ width: 80, display: 'inline-flex', justifyContent: 'flex-end' }}>
                <Pill size="sm" variant={statusInfo.variant}>{statusInfo.label}</Pill>
              </span>
            </>
          }
        />
      }
    />
  )
}
