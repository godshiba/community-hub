import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowClockwise } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useModerationStore } from '@/stores/moderation.store'
import { Button } from '@/components/ui-native/Button'
import { Tooltip } from '@/components/ui-native/Tooltip'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { Sheet } from '@/components/ui-native/Sheet'
import { Pill } from '@/components/ui-native/Pill'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { MembersList } from './MembersList'
import { MemberSummary } from './MemberSummary'
import { MemberDetailPanel } from './MemberDetailPanel'
import { WarningDialog } from './WarningDialog'
import { BanDialog } from './BanDialog'
import { BulkActionToolbar } from './BulkActionToolbar'
import { SpamEventsTab } from './SpamEventsTab'
import { AuditLogTab } from './AuditLogTab'
import { RaidAlert } from './RaidAlert'
import { ContentReviewQueue } from './ContentReviewQueue'

type ModerationTab = 'members' | 'content' | 'audit' | 'spam'

const TAB_OPTIONS = [
  { value: 'members', label: 'Members' },
  { value: 'content', label: 'Content' },
  { value: 'audit',   label: 'Audit'   },
  { value: 'spam',    label: 'Spam'    }
] as const satisfies ReadonlyArray<{ value: ModerationTab; label: string }>

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  height: '100%',
  minHeight: 0,
  maxWidth: 1400,
  width: '100%',
  marginInline: 'auto'
}

const ERROR_BANNER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingInline: 'var(--space-3)',
  paddingBlock: 'var(--space-2)',
  fontSize: 12,
  color: 'var(--color-error)',
  background: 'color-mix(in oklch, var(--color-error) 12%, transparent)',
  border: '1px solid color-mix(in oklch, var(--color-error) 28%, transparent)',
  borderRadius: 'var(--radius-md)'
}

export function ModerationPanel(): React.ReactElement {
  const fetchMembers = useModerationStore((s) => s.fetchMembers)
  const syncMembers  = useModerationStore((s) => s.syncMembers)
  const loading      = useModerationStore((s) => s.loading)
  const error        = useModerationStore((s) => s.error)
  const selectedIds  = useModerationStore((s) => s.selectedIds)

  const [tab, setTab] = useState<ModerationTab>('members')
  const [warnTarget, setWarnTarget] = useState<number | null>(null)
  const [banTarget, setBanTarget] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => { void fetchMembers() }, [fetchMembers])

  const isMembers = tab === 'members'
  const selectedCount = selectedIds.size

  usePanelToolbar({
    title: 'Moderation',
    subtitle: 'Manage members, review content, and audit agent actions',
    inspector: {
      enabled: isMembers,
      renderEmpty: () => (
        <MemberSummary
          onWarn={(id) => setWarnTarget(id)}
          onBan={(id) => setBanTarget(id)}
          onOpenDetail={() => setDetailOpen(true)}
        />
      )
    },
    actions: (
      <>
        {isMembers && selectedCount > 0 && (
          <Pill variant="accent" size="sm">{selectedCount} selected</Pill>
        )}
        <SegmentedControl
          size="sm"
          ariaLabel="Moderation section"
          options={TAB_OPTIONS}
          value={tab}
          onChange={(v) => setTab(v)}
        />
        <Tooltip label="Sync members" shortcut={['⌥', '⌘', 'S']} side="bottom">
          <Button
            variant="icon"
            size="sm"
            onClick={() => { void syncMembers() }}
            isLoading={loading}
            aria-label="Sync members"
          >
            <ArrowClockwise size={14} weight="bold" />
          </Button>
        </Tooltip>
      </>
    )
  })

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Moderation" subtitle="Manage members, review content, and audit agent actions" />

      <RaidAlert />

      {error && (
        <div style={ERROR_BANNER} role="alert">
          <span>{error}</span>
        </div>
      )}

      {tab === 'members' && (
        <>
          <BulkActionToolbar />
          <MembersList
            onWarn={(id) => setWarnTarget(id)}
            onBan={(id) => setBanTarget(id)}
            onOpenDetail={() => setDetailOpen(true)}
          />
        </>
      )}
      {tab === 'content' && <ContentReviewQueue />}
      {tab === 'audit'   && <AuditLogTab />}
      {tab === 'spam'    && <SpamEventsTab />}

      <Sheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Member detail"
        width="lg"
        ariaLabel="Member detail"
      >
        <MemberDetailPanel
          onWarn={(id) => setWarnTarget(id)}
          onBan={(id) => setBanTarget(id)}
        />
      </Sheet>

      <WarningDialog memberId={warnTarget} onClose={() => setWarnTarget(null)} />
      <BanDialog memberId={banTarget} onClose={() => setBanTarget(null)} />
    </div>
  )
}
