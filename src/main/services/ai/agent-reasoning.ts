import type { AiProvider } from './provider.interface'
import type { AgentProfile } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import type {
  AgentReasoningResult,
  AgentDecidedAction,
  IntentClassification,
  ConversationTurn
} from '@shared/agent-brain-types'
import type { ConversationContext } from './conversation.engine'
import { classifyIntent } from './intent-classifier'
import { assembleContext } from './context-assembler'
import { buildReasoningPrompt } from './reasoning-prompts'
import * as memoryRepo from './user-memory.repository'
import {
  retrieveKnowledge,
  buildKnowledgeContextBlock
} from './knowledge.service'
import { getMemberByPlatformId } from '../moderation.repository'
import { logAuditEntry } from '../audit.repository'

/** Maximum action execution rounds per message */
const MAX_ACTION_ROUNDS = 2

export interface ReasoningEngineResult {
  response: string
  confidence: number
  intent: IntentClassification
  thought: string | null
  actions: readonly AgentDecidedAction[]
  memoryUpdates: readonly string[]
  knowledgeEntryIds: readonly number[]
}

/**
 * Process a message through the full agent brain pipeline:
 * load memory -> classify intent -> assemble context -> reason -> execute actions -> save
 */
export async function processMessage(
  ctx: ConversationContext,
  provider: AiProvider,
  profile: AgentProfile
): Promise<ReasoningEngineResult> {
  // Step 1: Load user memory
  const memory = memoryRepo.getOrCreate(ctx.platform, ctx.userId, ctx.username)
  const recentTurns = memoryRepo.getConversationHistory(ctx.platform, ctx.userId, 5)

  // Step 2: Classify intent
  const intent = await classifyIntent(provider, ctx.message, recentTurns)

  // For simple intents (greeting, off_topic), skip heavy reasoning
  if (intent.intent === 'greeting' || intent.intent === 'off_topic') {
    return handleSimpleIntent(ctx, provider, profile, memory, intent, recentTurns)
  }

  // Step 3: Assemble context
  const assembled = assembleContext({
    platform: ctx.platform,
    channelId: ctx.channelId,
    userId: ctx.userId,
    username: ctx.username,
    message: ctx.message,
    intent,
    memory,
    recentTurns
  })

  // Step 4: Reason
  const systemPrompt = buildReasoningPrompt(profile, assembled, intent)
  const userPrompt = `[${ctx.platform}] ${ctx.username}: ${ctx.message}`

  let reasoning: AgentReasoningResult
  try {
    const raw = await provider.complete(systemPrompt, userPrompt)
    reasoning = parseReasoningResult(raw)
  } catch {
    // Graceful fallback: treat as simple LLM response
    return {
      response: 'I apologize, I had trouble processing that. Could you try rephrasing?',
      confidence: 0.3,
      intent,
      thought: null,
      actions: [],
      memoryUpdates: [],
      knowledgeEntryIds: []
    }
  }

  // Step 5: Execute actions (max 2 rounds)
  const executedActions = await executeActions(
    reasoning.actions,
    ctx,
    provider,
    profile,
    assembled
  )

  // If a search_knowledge or lookup_member action was taken, we may have a refined response
  const finalResponse = executedActions.refinedResponse ?? reasoning.response
  const finalConfidence = executedActions.refinedResponse
    ? Math.min(1, reasoning.confidence + 0.1)
    : reasoning.confidence

  // Step 6: Save memory
  const allFacts = [...memory.facts]
  for (const update of reasoning.memoryUpdates) {
    if (!allFacts.includes(update)) {
      allFacts.push(update)
    }
  }
  if (allFacts.length !== memory.facts.length) {
    memoryRepo.updateFacts(ctx.platform, ctx.userId, allFacts)
  }

  memoryRepo.incrementInteraction(ctx.platform, ctx.userId)
  memoryRepo.addConversationTurn({
    platform: ctx.platform,
    platformUserId: ctx.userId,
    channelId: ctx.channelId,
    userMessage: ctx.message,
    agentResponse: finalResponse,
    intent: intent.intent,
    knowledgeEntryIds: executedActions.knowledgeEntryIds,
    actions: executedActions.allActions,
    thought: reasoning.thought,
    confidence: finalConfidence
  })

  return {
    response: finalResponse,
    confidence: finalConfidence,
    intent,
    thought: reasoning.thought,
    actions: executedActions.allActions,
    memoryUpdates: reasoning.memoryUpdates,
    knowledgeEntryIds: executedActions.knowledgeEntryIds
  }
}

/**
 * Handle simple intents (greeting, off_topic) with a single LLM call.
 */
async function handleSimpleIntent(
  ctx: ConversationContext,
  provider: AiProvider,
  profile: AgentProfile,
  memory: ReturnType<typeof memoryRepo.getOrCreate>,
  intent: IntentClassification,
  recentTurns: readonly ConversationTurn[]
): Promise<ReasoningEngineResult> {
  const parts: string[] = [
    `You are ${profile.name}.`,
    profile.tone ? `Communication style: ${profile.tone}` : ''
  ].filter(Boolean)

  if (intent.intent === 'greeting' && memory.interactionCount > 0) {
    parts.push(`This is a returning user: ${memory.username}. They have interacted ${memory.interactionCount} times before.`)
    if (memory.facts.length > 0) {
      parts.push(`What you know about them: ${memory.facts.join('; ')}`)
    }
    parts.push('Greet them warmly and briefly. Reference what you know about them if appropriate.')
  } else if (intent.intent === 'off_topic') {
    parts.push('This message is off-topic for the community. Respond briefly and politely redirect.')
    if (profile.boundaries) parts.push(`Boundaries: ${profile.boundaries}`)
  }

  const systemPrompt = parts.join('\n')
  const userPrompt = `[${ctx.platform}] ${ctx.username}: ${ctx.message}`

  let response: string
  try {
    response = await provider.complete(systemPrompt, userPrompt)
  } catch {
    response = intent.intent === 'greeting'
      ? `Hello ${ctx.username}! How can I help you today?`
      : "I'm not sure that's something I can help with. Is there anything else?"
  }

  memoryRepo.incrementInteraction(ctx.platform, ctx.userId)
  memoryRepo.addConversationTurn({
    platform: ctx.platform,
    platformUserId: ctx.userId,
    channelId: ctx.channelId,
    userMessage: ctx.message,
    agentResponse: response,
    intent: intent.intent,
    knowledgeEntryIds: [],
    actions: [],
    thought: null,
    confidence: intent.confidence
  })

  return {
    response,
    confidence: intent.confidence,
    intent,
    thought: null,
    actions: [],
    memoryUpdates: [],
    knowledgeEntryIds: []
  }
}

/**
 * Parse the structured JSON output from the reasoning LLM call.
 * Gracefully falls back if JSON parsing fails.
 */
function parseReasoningResult(raw: string): AgentReasoningResult {
  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      thought: '',
      response: raw.trim(),
      actions: [],
      memoryUpdates: [],
      confidence: 0.5
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      thought: typeof parsed.thought === 'string' ? parsed.thought : '',
      response: typeof parsed.response === 'string' ? parsed.response : raw.trim(),
      actions: Array.isArray(parsed.actions)
        ? parsed.actions.filter(isValidAction)
        : [],
      memoryUpdates: Array.isArray(parsed.memory_updates)
        ? parsed.memory_updates.filter((u: unknown) => typeof u === 'string')
        : [],
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5
    }
  } catch {
    return {
      thought: '',
      response: raw.trim(),
      actions: [],
      memoryUpdates: [],
      confidence: 0.5
    }
  }
}

function isValidAction(action: unknown): action is AgentDecidedAction {
  if (typeof action !== 'object' || action === null) return false
  const a = action as Record<string, unknown>
  const validTypes = [
    'search_knowledge', 'lookup_member', 'escalate',
    'assign_role', 'create_reminder', 'tag_moderator', 'none'
  ]
  return typeof a.type === 'string' && validTypes.includes(a.type)
}

interface ActionExecutionResult {
  allActions: readonly AgentDecidedAction[]
  refinedResponse: string | null
  knowledgeEntryIds: readonly number[]
}

/**
 * Execute agent-decided actions and optionally re-call LLM with enriched context.
 */
async function executeActions(
  actions: readonly AgentDecidedAction[],
  ctx: ConversationContext,
  provider: AiProvider,
  profile: AgentProfile,
  assembled: ReturnType<typeof assembleContext>
): Promise<ActionExecutionResult> {
  const executedActions: AgentDecidedAction[] = []
  let refinedResponse: string | null = null
  const knowledgeEntryIds: number[] = []
  let rounds = 0

  for (const action of actions) {
    if (action.type === 'none') continue
    if (rounds >= MAX_ACTION_ROUNDS) break
    rounds++

    const executed = { ...action, params: { ...action.params } }

    switch (action.type) {
      case 'search_knowledge': {
        const query = typeof action.params.query === 'string'
          ? action.params.query
          : ctx.message
        const knowledge = retrieveKnowledge(query, ctx.platform, ctx.channelId)
        const knowledgeBlock = buildKnowledgeContextBlock(knowledge.entries)
        knowledgeEntryIds.push(...knowledge.usedEntryIds)
        executed.result = `Found ${knowledge.entries.length} entries`

        if (knowledge.entries.length > 0) {
          // Re-call LLM with knowledge appended
          const enrichedPrompt = `${buildReasoningPrompt(profile, { ...assembled, knowledgeContext: knowledgeBlock }, { intent: 'question', confidence: 0.8, needsKnowledge: true, needsUserHistory: false, isUrgent: false })}`
          try {
            const raw = await provider.complete(enrichedPrompt, `[${ctx.platform}] ${ctx.username}: ${ctx.message}`)
            const refined = parseReasoningResult(raw)
            refinedResponse = refined.response
          } catch {
            // Keep original response
          }
        }
        break
      }

      case 'lookup_member': {
        const member = getMemberByPlatformId(ctx.platform, ctx.userId)
        executed.result = member
          ? `${member.username} | Status: ${member.status} | Reputation: ${member.reputationScore} | Warnings: ${member.warningsCount}`
          : 'Member not found in database'
        break
      }

      case 'escalate': {
        const reason = typeof action.params.reason === 'string'
          ? action.params.reason
          : 'Agent escalated'
        const member = getMemberByPlatformId(ctx.platform, ctx.userId)
        logAuditEntry({
          moderator: profile.name,
          moderatorType: 'agent',
          targetMemberId: member?.id ?? null,
          targetUsername: ctx.username,
          actionType: 'escalation',
          reason,
          platform: ctx.platform,
          metadata: { source: 'agent-brain', channelId: ctx.channelId }
        })
        executed.result = 'Escalation created'
        break
      }

      case 'tag_moderator': {
        const reason = typeof action.params.reason === 'string'
          ? action.params.reason
          : 'Agent requests moderator attention'
        executed.result = `Moderator tagged: ${reason}`
        break
      }

      case 'assign_role': {
        executed.result = 'Role assignment requires manual approval'
        break
      }

      case 'create_reminder': {
        executed.result = 'Reminder noted for follow-up'
        break
      }
    }

    executedActions.push(executed)
  }

  return { allActions: executedActions, refinedResponse, knowledgeEntryIds }
}
