import type { AiProvider } from './provider.interface'
import type { AgentProfile, AgentPattern, AgentAction } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import * as repo from './agent.repository'
import { getChannelConfig } from './channel-config.service'
import { processMessage } from './agent-reasoning'

/** Confidence threshold — below this, actions go to approval queue */
const CONFIDENCE_THRESHOLD = 0.7

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

  /**
   * Delegate to the agent reasoning engine for a full brain-powered response.
   * The reasoning engine handles: memory, intent classification, context assembly,
   * chain-of-thought reasoning, action execution, and memory updates.
   */
  async respondWithLlm(ctx: ConversationContext): Promise<ConversationResult | null> {
    if (!this.provider || !this.profile) return null

    const result = await processMessage(ctx, this.provider, this.profile)

    const status = result.confidence >= CONFIDENCE_THRESHOLD ? 'completed' : 'pending'

    const action = repo.createAction({
      actionType: 'replied',
      platform: ctx.platform,
      context: JSON.stringify({
        channelId: ctx.channelId,
        userId: ctx.userId,
        username: ctx.username,
        intent: result.intent.intent,
        thought: result.thought,
        actions: result.actions,
        knowledgeEntryIds: result.knowledgeEntryIds
      }),
      input: ctx.message,
      output: result.response,
      status
    })

    return {
      response: result.response,
      confidence: result.confidence,
      action,
      knowledgeEntryIds: result.knowledgeEntryIds
    }
  }
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
