import type { AiProvider } from './provider.interface'
import type { AgentRunState, AgentStatus } from '@shared/agent-types'
import type { AiConfig } from '@shared/settings-types'
import { createProvider } from './provider.factory'
import { ConversationEngine } from './conversation.engine'
import type { ConversationContext, ConversationResult } from './conversation.engine'
import { AutomationEngine } from './automation.engine'
import type { AutomationEvent, AutomationMatch } from './automation.engine'
import * as repo from './agent.repository'
import { loadAiConfig } from '../credentials.repository'

let instance: AgentService | null = null

export class AgentService {
  private provider: AiProvider | null = null
  private _state: AgentRunState = 'unavailable'
  readonly conversation = new ConversationEngine()
  readonly automation = new AutomationEngine()

  /** Initialize from saved AI config */
  init(): void {
    const config = loadAiConfig()
    this.configure(config)
  }

  /** (Re)configure with a new AI config */
  configure(config: AiConfig): void {
    this.provider = createProvider(config)
    this.conversation.setProvider(this.provider)

    if (this.provider) {
      this._state = 'running'
      this.refreshAll()
    } else {
      this._state = 'unavailable'
    }
  }

  /** Refresh all cached data from DB */
  refreshAll(): void {
    this.conversation.refreshContext()
    this.automation.refresh()
  }

  get state(): AgentRunState {
    return this._state
  }

  getStatus(): AgentStatus {
    return {
      state: this._state,
      provider: this.provider?.name ?? null,
      actionsToday: repo.countTodayActions(),
      pendingApproval: repo.countPendingActions()
    }
  }

  pause(): void {
    if (this._state === 'running') {
      this._state = 'paused'
    }
  }

  resume(): void {
    if (this._state === 'paused') {
      this._state = 'running'
    }
  }

  isActive(): boolean {
    return this._state === 'running' && this.provider !== null
  }

  /** Process an incoming message through automation + conversation engines */
  async handleMessage(ctx: ConversationContext): Promise<{
    automationMatches: readonly AutomationMatch[]
    conversationResult: ConversationResult | null
  }> {
    if (!this.isActive()) {
      return { automationMatches: [], conversationResult: null }
    }

    // Check automation rules first
    const automationEvent: AutomationEvent = {
      type: 'message',
      platform: ctx.platform,
      channelId: ctx.channelId,
      userId: ctx.userId,
      username: ctx.username,
      content: ctx.message
    }
    const automationMatches = this.automation.evaluate(automationEvent)

    // If automation handled it, skip conversation engine
    if (automationMatches.length > 0) {
      return { automationMatches, conversationResult: null }
    }

    // Otherwise, use conversation engine
    const conversationResult = await this.conversation.respond(ctx)
    return { automationMatches, conversationResult }
  }

  /** Process a new member event through automation engine */
  handleNewMember(event: Omit<AutomationEvent, 'type'>): readonly AutomationMatch[] {
    if (!this.isActive()) return []
    return this.automation.evaluate({ ...event, type: 'new_member' })
  }

  /** Test provider connectivity */
  async testProvider(): Promise<{ success: boolean; error?: string }> {
    if (!this.provider) {
      return { success: false, error: 'No AI provider configured' }
    }
    try {
      await this.provider.complete('You are a test.', 'Reply with "OK".')
      return { success: true }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}

export function initAgentService(): AgentService {
  instance = new AgentService()
  instance.init()
  return instance
}

export function getAgentService(): AgentService {
  if (!instance) throw new Error('AgentService not initialized')
  return instance
}
