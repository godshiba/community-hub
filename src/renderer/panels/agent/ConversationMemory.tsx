import { useEffect, useState, useCallback } from 'react'
import { Search, User, Trash2, Clock, MessageSquare, Brain, Filter } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAgentBrainStore } from '@/stores/agent-brain.store'
import { ReasoningInspector } from './ReasoningInspector'
import { FactEditor, SummaryEditor, MemoryStatsBar, TurnSelectionBar } from './MemoryEditors'
import { UserRow, ConversationTurnRow } from './MemoryListItems'
import type { IntentType, MemoryUserEntry } from '@shared/agent-brain-types'

const INTENT_OPTIONS: readonly (IntentType | 'all')[] = [
  'all', 'question', 'request', 'complaint', 'greeting', 'follow_up', 'off_topic', 'feedback'
]

export function ConversationMemory(): React.ReactElement {
  const {
    selectedMemory,
    memoryLoading,
    memoryUsers,
    memoryStats,
    userConversations,
    recentConversations,
    conversationsLoading,
    selectedTurnId,
    searchQuery,
    fetchUserMemory,
    fetchUserConversations,
    fetchRecentConversations,
    fetchMemoryUsers,
    fetchMemoryStats,
    clearUserMemory,
    updateFacts,
    updateSummary,
    deleteTurns,
    runCompaction,
    setSelectedTurnId,
    setSearchQuery
  } = useAgentBrainStore()

  const [searchInput, setSearchInput] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [intentFilter, setIntentFilter] = useState<IntentType | 'all'>('all')
  const [selectedTurnIds, setSelectedTurnIds] = useState<ReadonlySet<number>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [compacting, setCompacting] = useState(false)
  const [compactResult, setCompactResult] = useState<number | null>(null)

  useEffect(() => {
    fetchRecentConversations(30)
    fetchMemoryUsers()
    fetchMemoryStats()
  }, [])

  const handleSearch = (): void => {
    if (!searchInput.trim()) return
    const parts = searchInput.split(':')
    if (parts.length === 2) {
      const [platform, userId] = parts
      if (platform !== 'discord' && platform !== 'telegram') return
      fetchUserMemory(platform, userId)
      fetchUserConversations(platform, userId)
      setSearchQuery(searchInput)
    }
  }

  const handleUserSelect = (entry: MemoryUserEntry): void => {
    fetchUserMemory(entry.platform, entry.platformUserId)
    fetchUserConversations(entry.platform, entry.platformUserId)
    setSearchQuery(`${entry.platform}:${entry.platformUserId}`)
    setSelectedTurnIds(new Set())
  }

  const handleClearMemory = async (): Promise<void> => {
    if (!selectedMemory) return
    await clearUserMemory(selectedMemory.platform, selectedMemory.platformUserId)
    setShowConfirmClear(false)
  }

  const handleToggleTurn = useCallback((turnId: number): void => {
    setSelectedTurnIds((prev) => {
      const next = new Set(prev)
      if (next.has(turnId)) {
        next.delete(turnId)
      } else {
        next.add(turnId)
      }
      return next
    })
  }, [])

  const handleDeleteTurns = async (): Promise<void> => {
    if (selectedTurnIds.size === 0) return
    setDeleting(true)
    await deleteTurns([...selectedTurnIds])
    setSelectedTurnIds(new Set())
    setDeleting(false)
  }

  const handleCompact = async (): Promise<void> => {
    setCompacting(true)
    setCompactResult(null)
    const result = await runCompaction()
    if (result) {
      setCompactResult(result.compacted)
    }
    setCompacting(false)
  }

  const selectedTurn = selectedTurnId
    ? (userConversations.find((t) => t.id === selectedTurnId) ??
       recentConversations.find((t) => t.id === selectedTurnId))
    : null

  const displayConversations = selectedMemory ? userConversations : recentConversations
  const filteredConversations = intentFilter === 'all'
    ? displayConversations
    : displayConversations.filter((t) => t.intent === intentFilter)

  return (
    <div className="flex gap-3 h-full min-h-0">
      {/* Left: Users + Memory + Conversations */}
      <div className="w-1/2 flex flex-col gap-2 min-h-0">
        {/* Stats Bar */}
        {memoryStats && (
          <MemoryStatsBar
            totalUsers={memoryStats.totalUsers}
            totalTurns={memoryStats.totalTurns}
            averageTurnsPerUser={memoryStats.averageTurnsPerUser}
            onCompact={handleCompact}
            compacting={compacting}
            compactResult={compactResult}
          />
        )}

        {/* User List */}
        {memoryUsers.length > 0 && (
          <div className="max-h-32 overflow-y-auto border border-glass-border rounded bg-glass-surface">
            {memoryUsers.map((entry) => (
              <UserRow
                key={entry.id}
                entry={entry}
                isActive={
                  selectedMemory?.platform === entry.platform &&
                  selectedMemory?.platformUserId === entry.platformUserId
                }
                onSelect={() => handleUserSelect(entry)}
              />
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search user: discord:userId or telegram:userId"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 py-1.5 bg-glass-surface border-glass rounded text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 transition-colors"
          >
            Search
          </button>
        </div>

        {/* User Memory Card */}
        {selectedMemory && (
          <GlassCard className="p-3 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-accent" />
                <span className="text-xs font-medium text-text-primary">{selectedMemory.username}</span>
                <span className="text-[10px] text-text-muted capitalize">{selectedMemory.platform}</span>
              </div>
              <div className="flex items-center gap-2">
                {showConfirmClear ? (
                  <>
                    <button
                      onClick={handleClearMemory}
                      className="px-2 py-0.5 bg-red-400/10 text-red-400 text-[10px] rounded hover:bg-red-400/20"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2 py-0.5 bg-white/5 text-text-muted text-[10px] rounded hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="p-1 text-text-muted hover:text-red-400 transition-colors"
                    title="Clear memory"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-text-muted">
                <MessageSquare className="size-2.5" />
                <span>{selectedMemory.interactionCount} interactions</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock className="size-2.5" />
                <span>First: {selectedMemory.firstInteraction.split('T')[0]}</span>
              </div>
              <div className="flex items-center gap-1 text-text-muted">
                <Clock className="size-2.5" />
                <span>Last: {selectedMemory.lastInteraction.split('T')[0]}</span>
              </div>
            </div>

            {selectedMemory.primaryLanguage && (
              <div className="text-[10px] text-text-muted">
                Language: {selectedMemory.primaryLanguage}
                {selectedMemory.expertiseLevel && ` | Level: ${selectedMemory.expertiseLevel}`}
              </div>
            )}

            {/* Editable Facts */}
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-text-secondary flex items-center gap-1">
                <Brain className="size-2.5" />
                Learned Facts
              </div>
              <FactEditor
                facts={selectedMemory.facts}
                platform={selectedMemory.platform}
                userId={selectedMemory.platformUserId}
                onUpdate={updateFacts}
              />
            </div>

            {/* Editable Summary */}
            <SummaryEditor
              summary={selectedMemory.conversationSummary}
              platform={selectedMemory.platform}
              userId={selectedMemory.platformUserId}
              onUpdate={updateSummary}
            />
          </GlassCard>
        )}

        {/* Intent Filter */}
        <div className="flex items-center gap-2">
          <Filter className="size-3 text-text-muted" />
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value as IntentType | 'all')}
            className="px-2 py-1 bg-glass-surface border border-glass-border rounded text-[10px] text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            {INTENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'All intents' : opt.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Turn Selection Bar */}
        {selectedTurnIds.size > 0 && (
          <TurnSelectionBar
            count={selectedTurnIds.size}
            onDelete={handleDeleteTurns}
            onClear={() => setSelectedTurnIds(new Set())}
            deleting={deleting}
          />
        )}

        {/* Conversation List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {memoryLoading || conversationsLoading ? (
            <div className="flex items-center justify-center h-20 text-xs text-text-muted">
              Loading...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-xs text-text-muted">
              {searchQuery ? 'No conversations found' : 'No recent conversations'}
            </div>
          ) : (
            filteredConversations.map((turn) => (
              <ConversationTurnRow
                key={turn.id}
                turn={turn}
                isSelected={turn.id === selectedTurnId}
                isChecked={selectedTurnIds.has(turn.id)}
                onSelect={() => setSelectedTurnId(turn.id)}
                onToggleCheck={() => handleToggleTurn(turn.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: Reasoning Inspector */}
      <div className="w-1/2 border-l border-glass-border min-h-0 overflow-y-auto">
        <ReasoningInspector turn={selectedTurn ?? null} />
      </div>
    </div>
  )
}

