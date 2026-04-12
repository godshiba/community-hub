import type { AiProvider } from './provider.interface'
import type { AgentProfile, AgentPattern, AgentAction } from '@shared/agent-types'
import type { ChannelAgentConfig } from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'
import * as repo from './agent.repository'
import { buildSystemPrompt } from './prompts/system.prompt'
import { retrieveKnowledge, buildKnowledgeContextBlock } from './knowledge.service'
import { getChannelConfig } from './channel-config.service'

/** Confidence threshold — below this, actions go to approval queue */
const CONFIDENCE_THRESHOLD = 0.7

/** Confidence boost when response is grounded in knowledge base */
const KNOWLEDGE_CONFIDENCE_BOOST = 0.15

/** Words/phrases that indicate the AI is uncertain */
const UNCERTAINTY_MARKERS = [
  "i'm not sure",
  "i don't know",
  'not certain',
  'i think',
  'maybe',
  'possibly',
  'unclear',
  'cannot determine',
  'i apologize'
]

export interface ConversationContext {
  platform: Platform
  channelId: string
  userId: string
  username: string
  message: string
}

export interface ConversationResult {
  response: string
  confidence: number
  action: AgentAction
  knowledgeEntryIds?: readonly number[]
}

export class ConversationEngine {
  private provider: AiProvider | null = null
  private profile: AgentProfile | null = null
  private patterns: readonly AgentPattern[] = []

  setProvider(provider: AiProvider | null): void {
    this.provider = provider
  }

  getProfile(): AgentProfile | null {
    return this.profile
  }

  refreshContext(): void {
    this.profile = repo.getProfile()
    this.patterns = repo.getPatterns()
  }

  /** Check if a message matches any pattern — returns result or null. No LLM call. */
  matchPattern(ctx: ConversationContext): ConversationResult | null {
    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue
      if (pattern.platform && pattern.platform !== ctx.platform) continue
      if (matchesPattern(pattern, ctx.message)) {
        const response = interpolateTemplate(pattern.responseTemplate, ctx)
        repo.incrementPatternUsage(pattern.id)

        const action = repo.createAction({
          actionType: 'replied',
          platform: ctx.platform,
          context: JSON.stringify({
            channelId: ctx.channelId,
            userId: ctx.userId,
            username: ctx.username,
            patternId: pattern.id
          }),
          input: ctx.message,
          output: response,
          status: 'completed'
        })

        return { response, confidence: 1.0, action }
      }
    }
    return null
  }

  /** Get the effective respond mode for a channel, considering per-channel overrides */
  getEffectiveRespondMode(
    platform: Platform,
    channelId: string
  ): 'always' | 'mentioned' | 'never' {
    const channelCfg = getChannelConfig(platform, channelId)
    if (channelCfg?.enabled) {
      return channelCfg.respondMode
    }
    return this.profile?.respondMode ?? 'mentioned'
  }

  /** Call the LLM to generate a response, enriched with knowledge base context. */
  async respondWithLlm(ctx: ConversationContext): Promise<ConversationResult | null> {
    if (!this.provider || !this.profile) return null

    // Look up per-channel config
    const channelConfig = getChannelConfig(ctx.platform, ctx.channelId)

    // Retrieve relevant knowledge
    const knowledgeScope = channelConfig?.enabled
      ? channelConfig.knowledgeCategoryIds
      : undefined
    const knowledge = retrieveKnowledge(
      ctx.message,
      ctx.platform,
      knowledgeScope as readonly number[] | undefined
    )
    const knowledgeContext = buildKnowledgeContextBlock(knowledge.entries)
    const hasKnowledge = knowledge.entries.length > 0

    // Build system prompt with knowledge and channel config
    const systemPrompt = buildSystemPrompt(this.profile, this.patterns, {
      knowledgeContext: knowledgeContext || undefined,
      channelConfig: channelConfig?.enabled ? channelConfig : null
    })
    const userPrompt = `[${ctx.platform}] ${ctx.username}: ${ctx.message}`

    const response = await this.provider.complete(systemPrompt, userPrompt)

    // Calculate confidence with knowledge boost
    let confidence = estimateConfidence(response)
    if (hasKnowledge) {
      confidence = Math.min(1.0, confidence + KNOWLEDGE_CONFIDENCE_BOOST)
    }

    const status = confidence >= CONFIDENCE_THRESHOLD ? 'completed' : 'pending'

    const action = repo.createAction({
      actionType: 'replied',
      platform: ctx.platform,
      context: JSON.stringify({
        channelId: ctx.channelId,
        userId: ctx.userId,
        username: ctx.username,
        knowledgeEntryIds: knowledge.usedEntryIds,
        channelConfigId: channelConfig?.id ?? null
      }),
      input: ctx.message,
      output: response,
      status
    })

    return {
      response,
      confidence,
      action,
      knowledgeEntryIds: knowledge.usedEntryIds
    }
  }
}

function estimateConfidence(response: string): number {
  const lower = response.toLowerCase()
  let penalty = 0

  for (const marker of UNCERTAINTY_MARKERS) {
    if (lower.includes(marker)) {
      penalty += 0.15
    }
  }

  // Very short responses get a slight penalty
  if (response.length < 20) penalty += 0.1

  return Math.max(0, 1 - penalty)
}

function interpolateTemplate(template: string, ctx: ConversationContext): string {
  return template
    .replace(/\{username\}/g, ctx.username)
    .replace(/\{platform\}/g, ctx.platform)
    .replace(/\{message\}/g, ctx.message)
}

function matchesPattern(pattern: AgentPattern, message: string): boolean {
  const lower = message.toLowerCase()

  switch (pattern.triggerType) {
    case 'keyword':
      return lower.includes(pattern.triggerValue.toLowerCase())
    case 'regex':
      try {
        return new RegExp(pattern.triggerValue, 'i').test(message)
      } catch {
        return false
      }
    case 'intent':
      return lower.includes(pattern.triggerValue.toLowerCase())
    default:
      return false
  }
}
