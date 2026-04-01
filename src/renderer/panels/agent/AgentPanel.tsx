import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useAgentStore } from '@/stores/agent.store'
import { AgentControls } from './AgentControls'
import { ActionFeed } from './ActionFeed'
import { ActionFilters } from './ActionFilters'
import { ApprovalQueue } from './ApprovalQueue'
import { ConversationThread } from './ConversationThread'

export function AgentPanel(): React.ReactElement {
  const {
    status,
    actions,
    actionsLoading,
    filterType,
    filterPlatform,
    filterStatus,
    fetchStatus,
    fetchActions,
    setFilterType,
    setFilterPlatform,
    setFilterStatus,
    approveAction,
    rejectAction,
    editAction,
    pause,
    resume
  } = useAgentStore()

  const [selectedActionId, setSelectedActionId] = useState<number | null>(null)

  useEffect(() => {
    fetchStatus()
    fetchActions()
    const interval = setInterval(() => {
      fetchStatus()
      fetchActions()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const selectedAction = actions.find((a) => a.id === selectedActionId) ?? null

  if (status?.state === 'unavailable') {
    return (
      <GlassPanel className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-text-secondary">No AI provider configured</p>
          <p className="text-xs text-text-muted mt-1">
            Go to Settings and configure an AI provider to enable the agent
          </p>
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="p-4 space-y-3 overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Agent Terminal</h2>
          <p className="text-xs text-text-secondary">AI agent actions and controls</p>
        </div>
        <AgentControls status={status} onPause={pause} onResume={resume} />
      </div>

      <ActionFilters
        filterType={filterType}
        filterPlatform={filterPlatform}
        filterStatus={filterStatus}
        onTypeChange={setFilterType}
        onPlatformChange={setFilterPlatform}
        onStatusChange={setFilterStatus}
      />

      <div className="flex gap-3 flex-1 min-h-0">
        <div className="w-1/2 flex flex-col gap-3 overflow-hidden">
          <ApprovalQueue
            actions={[...actions]}
            onApprove={approveAction}
            onReject={rejectAction}
            onEdit={editAction}
          />

          <div className="flex-1 min-h-0 overflow-y-auto">
            <ActionFeed
              actions={actions}
              loading={actionsLoading}
              selectedId={selectedActionId}
              onSelect={setSelectedActionId}
            />
          </div>
        </div>

        <div className="w-1/2 border-l border-glass-border overflow-y-auto">
          <ConversationThread action={selectedAction} />
        </div>
      </div>
    </GlassPanel>
  )
}
