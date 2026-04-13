import type { Platform } from '@shared/settings-types'
import type {
  IntentClassification,
  UserMemory,
  ConversationTurn,
  AssembledContext
} from '@shared/agent-brain-types'
import {
  retrieveKnowledge,
  buildKnowledgeContextBlock
} from './knowledge.service'
import { getChannelConfig } from './channel-config.service'
import { getMemberByPlatformId } from '../moderation.repository'

/** Max tokens budget for assembled context (approximate by character count) */
const MAX_CONTEXT_CHARS = 12000

/**
 * Assemble the right context based on intent, user memory, and conversation history.
 * Only loads what the intent actually needs — avoids wasting context budget.
 */
export function assembleContext(params: {
  platform: Platform
  channelId: string
  userId: string
  username: string
  message: string
  intent: IntentClassification
  memory: UserMemory
  recentTurns: readonly ConversationTurn[]
}): AssembledContext {
  const { platform, channelId, userId, message, intent, memory, recentTurns } = params

  // 1. User profile — always included (cheap)
  const userProfile = buildUserProfile(memory)

  // 2. Conversation history — included for follow_up, question, complaint
  const conversationHistory = buildConversationHistory(
    recentTurns,
    memory.conversationSummary,
    intent.intent === 'greeting' ? 2 : 5
  )

  // 3. Knowledge context — only if intent requires it
  let knowledgeContext = ''
  if (intent.needsKnowledge) {
    const channelCfg = getChannelConfig(platform, channelId)
    const scope = channelCfg?.enabled ? channelCfg.knowledgeCategoryIds : undefined
    const knowledge = retrieveKnowledge(
      message,
      platform,
      channelId,
      scope as readonly number[] | undefined
    )
    knowledgeContext = buildKnowledgeContextBlock(knowledge.entries)
  }

  // 4. Member profile — only if intent needs user history
  let memberProfile: string | null = null
  if (intent.needsUserHistory) {
    const member = getMemberByPlatformId(platform, userId)
    if (member) {
      memberProfile = `Community member: ${member.username} | Status: ${member.status} | Joined: ${member.joinDate ?? 'unknown'} | Reputation: ${member.reputationScore} | Warnings: ${member.warningsCount}`
    }
  }

  // 5. Channel context
  let channelContext: string | null = null
  const channelCfg = getChannelConfig(platform, channelId)
  if (channelCfg?.enabled) {
    const parts: string[] = [`Channel: ${channelCfg.channelName || channelCfg.channelId}`]
    if (channelCfg.personalityOverride) {
      parts.push(`Style: ${channelCfg.personalityOverride}`)
    }
    if (channelCfg.systemPromptOverride) {
      parts.push(`Instructions: ${channelCfg.systemPromptOverride}`)
    }
    channelContext = parts.join(' | ')
  }

  // 6. Available actions
  const availableActions = buildAvailableActions(intent)

  // Truncate if total context exceeds budget
  return truncateContext({
    userProfile,
    conversationHistory,
    knowledgeContext,
    memberProfile,
    channelContext,
    availableActions
  })
}

function buildUserProfile(memory: UserMemory): string {
  const parts: string[] = [
    `${memory.username} (${memory.platform})`,
    `Interactions: ${memory.interactionCount}`,
    `First seen: ${memory.firstInteraction.split('T')[0]}`
  ]

  if (memory.primaryLanguage) {
    parts.push(`Language: ${memory.primaryLanguage}`)
  }
  if (memory.expertiseLevel) {
    parts.push(`Level: ${memory.expertiseLevel}`)
  }
  if (memory.facts.length > 0) {
    parts.push(`Known facts: ${memory.facts.join('; ')}`)
  }

  return parts.join(' | ')
}

function buildConversationHistory(
  turns: readonly ConversationTurn[],
  summary: string | null,
  maxTurns: number
): string {
  const parts: string[] = []

  if (summary) {
    parts.push(`Previous interaction summary: ${summary}`)
  }

  const recent = turns.slice(-maxTurns)
  if (recent.length > 0) {
    parts.push('Recent conversation:')
    for (const turn of recent) {
      parts.push(`User: ${turn.userMessage}`)
      parts.push(`Agent: ${turn.agentResponse}`)
    }
  }

  return parts.join('\n')
}

function buildAvailableActions(intent: IntentClassification): string {
  const actions: string[] = [
    '- search_knowledge: { "query": "..." } - search for more information',
    '- lookup_member: {} - get this user\'s full community profile'
  ]

  if (intent.isUrgent || intent.intent === 'complaint') {
    actions.push('- escalate: { "reason": "..." } - escalate to a human moderator')
    actions.push('- tag_moderator: { "reason": "..." } - ping a moderator in channel')
  }

  if (intent.intent === 'request') {
    actions.push('- assign_role: { "role": "..." } - assign a role to this user')
    actions.push('- create_reminder: { "message": "...", "hours": N } - schedule a follow-up')
  }

  // Always allow escalation and reminders
  if (intent.intent !== 'complaint' && !intent.isUrgent) {
    actions.push('- escalate: { "reason": "..." } - escalate to a human moderator')
  }
  actions.push('- none - just respond, no action needed')

  return actions.join('\n')
}

function truncateContext(ctx: AssembledContext): AssembledContext {
  const total = Object.values(ctx).reduce(
    (sum, v) => sum + (v?.length ?? 0),
    0
  )

  if (total <= MAX_CONTEXT_CHARS) return ctx

  // Prioritize: userProfile > conversationHistory > knowledgeContext > rest
  // Truncate knowledge context first (it's the largest)
  const excess = total - MAX_CONTEXT_CHARS
  if (ctx.knowledgeContext.length > excess) {
    return {
      ...ctx,
      knowledgeContext: ctx.knowledgeContext.slice(0, ctx.knowledgeContext.length - excess)
    }
  }

  // If still over, truncate conversation history
  return {
    ...ctx,
    knowledgeContext: ctx.knowledgeContext.slice(0, Math.floor(ctx.knowledgeContext.length / 2)),
    conversationHistory: ctx.conversationHistory.slice(0, Math.floor(ctx.conversationHistory.length / 2))
  }
}
