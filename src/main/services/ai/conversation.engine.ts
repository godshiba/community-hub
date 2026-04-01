import type { AiProvider } from './provider.interface'
import type { AgentProfile, AgentPattern, AgentAction } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import * as repo from './agent.repository'
import { buildSystemPrompt } from './prompts/system.prompt'

/** Confidence threshold — below this, actions go to approval queue */
const CONFIDENCE_THRESHOLD = 0.7

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
}

export class ConversationEngine {
  private provider: AiProvider | null = null
  private profile: AgentProfile | null = null
  private patterns: readonly AgentPattern[] = []

  setProvider(provider: AiProvider | null): void {
    this.provider = provider
  }

  refreshContext(): void {
    this.profile = repo.getProfile()
    this.patterns = repo.getPatterns()
  }

  async respond(ctx: ConversationContext): Promise<ConversationResult | null> {
    if (!this.provider || !this.profile) return null

    const systemPrompt = buildSystemPrompt(this.profile, this.patterns)
    const userPrompt = `[${ctx.platform}] ${ctx.username}: ${ctx.message}`

    const response = await this.provider.complete(systemPrompt, userPrompt)
    const confidence = estimateConfidence(response)
    const status = confidence >= CONFIDENCE_THRESHOLD ? 'completed' : 'pending'

    const action = repo.createAction({
      actionType: 'replied',
      platform: ctx.platform,
      context: JSON.stringify({
        channelId: ctx.channelId,
        userId: ctx.userId,
        username: ctx.username
      }),
      input: ctx.message,
      output: response,
      status
    })

    // Check if any pattern matched and bump usage
    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue
      if (matchesPattern(pattern, ctx.message)) {
        repo.incrementPatternUsage(pattern.id)
        break
      }
    }

    return { response, confidence, action }
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
