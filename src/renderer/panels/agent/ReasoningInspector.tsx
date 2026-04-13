import { memo } from 'react'
import {
  Brain,
  Target,
  BookOpen,
  Zap,
  User,
  Bot
} from 'lucide-react'
import type { ConversationTurn, AgentDecidedAction } from '@shared/agent-brain-types'

interface ReasoningInspectorProps {
  turn: ConversationTurn | null
}

export const ReasoningInspector = memo(function ReasoningInspector({
  turn
}: ReasoningInspectorProps): React.ReactElement {
  if (!turn) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-muted">
        Select a conversation turn to inspect reasoning
      </div>
    )
  }

  return (
    <div className="space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-text-muted border-b border-glass-border pb-2">
        <span className="capitalize font-medium text-text-secondary">{turn.platform}</span>
        <span>{turn.platformUserId}</span>
        <span className="ml-auto">{new Date(turn.createdAt).toLocaleString()}</span>
      </div>

      {/* Messages */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="shrink-0 p-1.5 bg-blue-400/10 text-blue-400 rounded mt-0.5">
            <User className="size-3" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-text-muted mb-0.5">User</div>
            <div className="text-xs text-text-primary bg-white/[0.03] rounded px-2.5 py-2">
              {turn.userMessage}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="shrink-0 p-1.5 bg-accent/10 text-accent rounded mt-0.5">
            <Bot className="size-3" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-text-muted mb-0.5">Agent</div>
            <div className="text-xs text-text-primary bg-white/[0.03] rounded px-2.5 py-2">
              {turn.agentResponse}
            </div>
          </div>
        </div>
      </div>

      {/* Intent Classification */}
      {turn.intent && (
        <Section icon={Target} title="Intent Classification">
          <div className="flex items-center gap-2">
            <IntentBadge intent={turn.intent} />
            {turn.confidence != null && (
              <span className="text-[10px] text-text-muted">
                Confidence: {(turn.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </Section>
      )}

      {/* Chain of Thought */}
      {turn.thought && (
        <Section icon={Brain} title="Chain of Thought">
          <div className="text-xs text-text-secondary bg-yellow-400/5 border border-yellow-400/10 rounded p-2 whitespace-pre-wrap">
            {turn.thought}
          </div>
        </Section>
      )}

      {/* Actions */}
      {turn.actions.length > 0 && (
        <Section icon={Zap} title="Actions Taken">
          <div className="space-y-1.5">
            {turn.actions.map((action, i) => (
              <ActionRow key={i} action={action} />
            ))}
          </div>
        </Section>
      )}

      {/* Knowledge Entries Used */}
      {turn.knowledgeEntryIds.length > 0 && (
        <Section icon={BookOpen} title="Knowledge Entries Used">
          <div className="flex flex-wrap gap-1">
            {turn.knowledgeEntryIds.map((id) => (
              <span
                key={id}
                className="px-1.5 py-0.5 bg-blue-400/10 text-blue-400 text-[10px] rounded"
              >
                Entry #{id}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
})

function Section({
  icon: Icon,
  title,
  children
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
        <Icon className="size-3" />
        {title}
      </div>
      {children}
    </div>
  )
}

function ActionRow({ action }: { action: AgentDecidedAction }): React.ReactElement {
  const typeColors: Record<string, string> = {
    search_knowledge: 'text-blue-400 bg-blue-400/10',
    lookup_member: 'text-purple-400 bg-purple-400/10',
    escalate: 'text-red-400 bg-red-400/10',
    tag_moderator: 'text-orange-400 bg-orange-400/10',
    assign_role: 'text-green-400 bg-green-400/10',
    create_reminder: 'text-cyan-400 bg-cyan-400/10',
    none: 'text-text-muted bg-white/5'
  }

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${typeColors[action.type] ?? 'text-text-muted bg-white/5'}`}>
        {action.type.replace(/_/g, ' ')}
      </span>
      <div className="flex-1 min-w-0">
        {Object.keys(action.params).length > 0 && (
          <div className="text-[10px] text-text-muted truncate">
            {JSON.stringify(action.params)}
          </div>
        )}
        {action.result && (
          <div className="text-[10px] text-text-secondary mt-0.5">
            Result: {action.result}
          </div>
        )}
      </div>
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
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[intent] ?? 'text-text-muted bg-white/5'}`}>
      {intent.replace(/_/g, ' ')}
    </span>
  )
}
