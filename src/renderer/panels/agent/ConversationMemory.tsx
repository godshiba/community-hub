import { useEffect, useState } from 'react'
import { Search, User, Trash2, Clock, MessageSquare, Brain } from 'lucide-react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useAgentBrainStore } from '@/stores/agent-brain.store'
import { ReasoningInspector } from './ReasoningInspector'
import type { ConversationTurn } from '@shared/agent-brain-types'

export function ConversationMemory(): React.ReactElement {
  const {
    selectedMemory,
    memoryLoading,
    userConversations,
    recentConversations,
    conversationsLoading,
    selectedTurnId,
    searchQuery,
    fetchUserMemory,
    fetchUserConversations,
    fetchRecentConversations,
    clearUserMemory,
    setSelectedTurnId,
    setSearchQuery
  } = useAgentBrainStore()

  const [searchInput, setSearchInput] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    fetchRecentConversations(30)
  }, [])

  const handleSearch = (): void => {
    if (!searchInput.trim()) return
    // Parse "platform:userId" format or search in recent conversations
    const parts = searchInput.split(':')
    if (parts.length === 2) {
      const [platform, userId] = parts
      fetchUserMemory(platform, userId)
      fetchUserConversations(platform, userId)
      setSearchQuery(searchInput)
    }
  }

  const handleClearMemory = (): void => {
    if (!selectedMemory) return
    clearUserMemory(selectedMemory.platform, selectedMemory.platformUserId)
    setShowConfirmClear(false)
  }

  const selectedTurn = selectedTurnId
    ? (userConversations.find((t) => t.id === selectedTurnId) ??
       recentConversations.find((t) => t.id === selectedTurnId))
    : null

  const displayConversations = selectedMemory ? userConversations : recentConversations

  return (
    <div className="flex gap-3 h-full min-h-0">
      {/* Left: Memory + Conversation List */}
      <div className="w-1/2 flex flex-col gap-3 min-h-0">
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

            {selectedMemory.facts.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-text-secondary flex items-center gap-1">
                  <Brain className="size-2.5" />
                  Learned Facts
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedMemory.facts.map((fact, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] rounded">
                      {fact}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedMemory.conversationSummary && (
              <div className="text-[10px] text-text-muted bg-white/[0.03] rounded p-2">
                <span className="font-medium text-text-secondary">Summary: </span>
                {selectedMemory.conversationSummary}
              </div>
            )}
          </GlassCard>
        )}

        {/* Conversation List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
          {memoryLoading || conversationsLoading ? (
            <div className="flex items-center justify-center h-20 text-xs text-text-muted">
              Loading...
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-xs text-text-muted">
              {searchQuery ? 'No conversations found' : 'No recent conversations'}
            </div>
          ) : (
            displayConversations.map((turn) => (
              <ConversationTurnRow
                key={turn.id}
                turn={turn}
                isSelected={turn.id === selectedTurnId}
                onSelect={() => setSelectedTurnId(turn.id)}
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

function ConversationTurnRow({
  turn,
  isSelected,
  onSelect
}: {
  turn: ConversationTurn
  isSelected: boolean
  onSelect: () => void
}): React.ReactElement {
  return (
    <div
      onClick={onSelect}
      className={`p-2.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent/10 border border-accent/20'
          : 'hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted capitalize">{turn.platform}</span>
          {turn.intent && (
            <IntentBadge intent={turn.intent} />
          )}
          {turn.confidence != null && (
            <ConfidenceDot confidence={turn.confidence} />
          )}
        </div>
        <span className="text-[10px] text-text-muted">
          {new Date(turn.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="text-xs text-text-secondary truncate">{turn.userMessage}</div>
      <div className="text-[10px] text-text-muted truncate mt-0.5">{turn.agentResponse}</div>
    </div>
  )
}

function IntentBadge({ intent }: { intent: string }): React.ReactElement {
  const colors: Record<string, string> = {
    question: 'text-blue-400 bg-blue-400/10',
    request: 'text-purple-400 bg-purple-400/10',
    complaint: 'text-red-400 bg-red-400/10',
    greeting: 'text-green-400 bg-green-400/10',
    follow_up: 'text-yellow-400 bg-yellow-400/10',
    off_topic: 'text-text-muted bg-white/5',
    feedback: 'text-cyan-400 bg-cyan-400/10'
  }

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] ${colors[intent] ?? 'text-text-muted bg-white/5'}`}>
      {intent.replace('_', ' ')}
    </span>
  )
}

function ConfidenceDot({ confidence }: { confidence: number }): React.ReactElement {
  const color = confidence >= 0.8
    ? 'bg-green-400'
    : confidence >= 0.5
      ? 'bg-yellow-400'
      : 'bg-red-400'

  return (
    <div className="flex items-center gap-1">
      <div className={`size-1.5 rounded-full ${color}`} />
      <span className="text-[10px] text-text-muted">{(confidence * 100).toFixed(0)}%</span>
    </div>
  )
}
