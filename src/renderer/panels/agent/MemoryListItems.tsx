import { User } from 'lucide-react'
import type { ConversationTurn, MemoryUserEntry } from '@shared/agent-brain-types'

// ---------------------------------------------------------------------------
// User Row
// ---------------------------------------------------------------------------

export function UserRow({
  entry,
  isActive,
  onSelect
}: {
  entry: MemoryUserEntry
  isActive: boolean
  onSelect: () => void
}): React.ReactElement {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors border-b border-glass-border last:border-b-0 ${
        isActive ? 'bg-accent/10' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="size-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <User className="size-3 text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-primary truncate">{entry.username}</span>
          <PlatformBadge platform={entry.platform} />
        </div>
      </div>
      <div className="text-[10px] text-text-muted text-right shrink-0">
        <div>{entry.interactionCount} turns</div>
        <div>{entry.lastInteraction.split('T')[0]}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Platform Badge
// ---------------------------------------------------------------------------

function PlatformBadge({ platform }: { platform: string }): React.ReactElement {
  const color = platform === 'discord'
    ? 'text-indigo-400 bg-indigo-400/10'
    : 'text-blue-400 bg-blue-400/10'

  return (
    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${color}`}>
      {platform}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Conversation Turn Row (with checkbox)
// ---------------------------------------------------------------------------

export function ConversationTurnRow({
  turn,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck
}: {
  turn: ConversationTurn
  isSelected: boolean
  isChecked: boolean
  onSelect: () => void
  onToggleCheck: () => void
}): React.ReactElement {
  return (
    <div
      className={`flex items-start gap-2 p-2.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent/10 border border-accent/20'
          : 'hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggleCheck}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 shrink-0 accent-accent"
      />
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted capitalize">{turn.platform}</span>
            {turn.intent && <IntentBadge intent={turn.intent} />}
            {turn.confidence != null && <ConfidenceDot confidence={turn.confidence} />}
          </div>
          <span className="text-[10px] text-text-muted">
            {new Date(turn.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-text-secondary truncate">{turn.userMessage}</div>
        <div className="text-[10px] text-text-muted truncate mt-0.5">{turn.agentResponse}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared badges
// ---------------------------------------------------------------------------

export function IntentBadge({ intent }: { intent: string }): React.ReactElement {
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
      {intent.replace(/_/g, ' ')}
    </span>
  )
}

export function ConfidenceDot({ confidence }: { confidence: number }): React.ReactElement {
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
