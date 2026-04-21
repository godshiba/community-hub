import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useAgentStore } from '@/stores/agent.store'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentControls } from './AgentControls'
import { ActionFeed } from './ActionFeed'
import { ActionFilters } from './ActionFilters'
import { ApprovalQueue } from './ApprovalQueue'
import { ConversationThread } from './ConversationThread'
import { KnowledgeBasePanel } from './KnowledgeBasePanel'
import { ConversationMemory } from './ConversationMemory'
import { BrainSettings } from './BrainSettings'

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
    <GlassPanel className="p-4 overflow-hidden h-full flex flex-col">
      <PanelHeader
        title="Agent Terminal"
        subtitle="AI agent actions, knowledge base, and controls"
        actions={<AgentControls status={status} onPause={pause} onResume={resume} />}
      />

      <Tabs defaultValue="terminal" className="flex-1 flex flex-col min-h-0 mt-3">
        <TabsList className="bg-glass-surface border-glass shrink-0">
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="terminal" className="flex-1 min-h-0 flex flex-col gap-3 mt-3">
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
        </TabsContent>

        <TabsContent value="knowledge" className="flex-1 min-h-0 mt-3">
          <KnowledgeBasePanel />
        </TabsContent>

        <TabsContent value="memory" className="flex-1 min-h-0 mt-3">
          <ConversationMemory />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-3">
          <BrainSettings />
        </TabsContent>
      </Tabs>
    </GlassPanel>
  )
}
