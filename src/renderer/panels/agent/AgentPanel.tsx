import { useEffect, useState, type CSSProperties } from 'react'
import { Pulse, Robot } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useAgentStore } from '@/stores/agent.store'
import { Toggle } from '@/components/ui-native/Toggle'
import { Pill } from '@/components/ui-native/Pill'
import { Tooltip } from '@/components/ui-native/Tooltip'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { Button } from '@/components/ui-native/Button'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { ActionFeed } from './ActionFeed'
import { ActionFilters } from './ActionFilters'
import { ApprovalQueue } from './ApprovalQueue'
import { ActionDetail } from './ActionDetail'
import { KnowledgeBasePanel } from './KnowledgeBasePanel'
import { ConversationMemory } from './ConversationMemory'
import { BrainSettings } from './BrainSettings'
import { usePanelStore } from '@/stores/panel.store'

type AgentTab = 'terminal' | 'knowledge' | 'memory' | 'settings'

const TAB_OPTIONS = [
  { value: 'terminal',  label: 'Terminal'  },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'memory',    label: 'Memory'    },
  { value: 'settings',  label: 'Settings'  }
] as const satisfies ReadonlyArray<{ value: AgentTab; label: string }>

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

const STATUS_META: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: 'var(--color-fg-tertiary)'
}

export function AgentPanel(): React.ReactElement {
  const status         = useAgentStore((s) => s.status)
  const actions        = useAgentStore((s) => s.actions)
  const actionsLoading = useAgentStore((s) => s.actionsLoading)
  const filterType     = useAgentStore((s) => s.filterType)
  const filterPlatform = useAgentStore((s) => s.filterPlatform)
  const filterStatus   = useAgentStore((s) => s.filterStatus)
  const fetchStatus    = useAgentStore((s) => s.fetchStatus)
  const fetchActions   = useAgentStore((s) => s.fetchActions)
  const setFilterType     = useAgentStore((s) => s.setFilterType)
  const setFilterPlatform = useAgentStore((s) => s.setFilterPlatform)
  const setFilterStatus   = useAgentStore((s) => s.setFilterStatus)
  const approveAction  = useAgentStore((s) => s.approveAction)
  const rejectAction   = useAgentStore((s) => s.rejectAction)
  const editAction     = useAgentStore((s) => s.editAction)
  const pause          = useAgentStore((s) => s.pause)
  const resume         = useAgentStore((s) => s.resume)
  const setActivePanel = usePanelStore((s) => s.setActivePanel)

  const [tab, setTab] = useState<AgentTab>('terminal')
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)

  useEffect(() => {
    void fetchStatus()
    void fetchActions()
    const interval = setInterval(() => {
      void fetchStatus()
      void fetchActions()
    }, 10_000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchActions])

  const state = status?.state ?? 'unavailable'
  const isRunning = state === 'running'
  const pending = status?.pendingApproval ?? 0
  const selectedAction = actions.find((a) => a.id === selectedActionId) ?? null

  function scrollToApprovals(): void {
    setTab('terminal')
    setTimeout(() => {
      document.getElementById('approval-queue')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  usePanelToolbar({
    title: 'Agent',
    inspector: {
      enabled: true,
      renderEmpty: () => <ActionDetail action={selectedAction} />
    },
    actions: state === 'unavailable' ? null : (
      <>
        {pending > 0 && (
          <button
            onClick={scrollToApprovals}
            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            aria-label={`${pending} pending approvals`}
          >
            <Pill size="sm" variant="warning">{pending} pending</Pill>
          </button>
        )}
        <span style={STATUS_META}>
          <Pulse size={12} />
          {status?.actionsToday ?? 0} today
        </span>
        <Toggle
          checked={isRunning}
          onChange={(next) => { void (next ? resume() : pause()) }}
          label={isRunning ? 'Pause agent' : 'Resume agent'}
        />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-fg-secondary)' }}>
          {isRunning ? 'Active' : 'Paused'}
        </span>
      </>
    )
  })

  if (state === 'unavailable') {
    return (
      <div style={CONTAINER}>
        <HeroTitle title="Agent" />
        <EmptyState
          size="lg"
          icon={<Robot size={56} />}
          title="No AI provider configured"
          subtitle="Configure a Claude, OpenAI, Grok, or Gemini provider in Settings to enable the agent."
          action={
            <Button variant="primary" onClick={() => setActivePanel('settings')}>
              Open Settings
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Agent" subtitle={status?.provider ? `Provider: ${status.provider}` : undefined} />

      <SegmentedControl
        size="sm"
        ariaLabel="Agent section"
        options={TAB_OPTIONS}
        value={tab}
        onChange={(v) => setTab(v)}
      />

      {tab === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ActionFilters
            filterType={filterType}
            filterPlatform={filterPlatform}
            filterStatus={filterStatus}
            onTypeChange={setFilterType}
            onPlatformChange={setFilterPlatform}
            onStatusChange={setFilterStatus}
          />
          <ApprovalQueue
            actions={[...actions]}
            onApprove={approveAction}
            onReject={rejectAction}
            onEdit={editAction}
          />
          <ActionFeed
            actions={actions}
            loading={actionsLoading}
            selectedId={selectedActionId}
            onSelect={setSelectedActionId}
          />
        </div>
      )}

      {tab === 'knowledge' && <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}><KnowledgeBasePanel /></div>}
      {tab === 'memory'    && <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}><ConversationMemory /></div>}
      {tab === 'settings'  && <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}><BrainSettings /></div>}
    </div>
  )
}
