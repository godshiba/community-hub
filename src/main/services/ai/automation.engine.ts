import type { AgentAutomation, AgentAction } from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'
import * as repo from './agent.repository'

export interface AutomationEvent {
  type: 'message' | 'new_member' | 'member_left'
  platform: Platform
  channelId: string
  userId: string
  username: string
  content?: string
}

export interface AutomationMatch {
  automation: AgentAutomation
  action: AgentAction
  /** The resolved response text to send (if applicable) */
  responseText: string | null
}

export class AutomationEngine {
  private automations: readonly AgentAutomation[] = []

  refresh(): void {
    this.automations = repo.getAutomations()
  }

  /** Evaluate an event against all enabled automations, return matches */
  evaluate(event: AutomationEvent): readonly AutomationMatch[] {
    const matches: AutomationMatch[] = []

    for (const rule of this.automations) {
      if (!rule.enabled) continue
      if (rule.platform && rule.platform !== event.platform) continue

      if (this.triggerMatches(rule, event)) {
        repo.markAutomationTriggered(rule.id)

        // Extract the actual response text from the action payload
        const template = typeof rule.action.payload?.template === 'string'
          ? rule.action.payload.template : null
        const responseText = template
          ? interpolateTemplate(template, event)
          : `[${rule.action.type}] ${rule.name}`

        const action = repo.createAction({
          actionType: mapActionType(rule.action.type),
          platform: event.platform,
          context: JSON.stringify({
            automationId: rule.id,
            automationName: rule.name,
            channelId: event.channelId,
            userId: event.userId,
            username: event.username
          }),
          input: event.content ?? null,
          output: responseText,
          status: 'completed'
        })

        matches.push({ automation: rule, action, responseText: template ? responseText : null })
      }
    }

    return matches
  }

  private triggerMatches(rule: AgentAutomation, event: AutomationEvent): boolean {
    const { trigger } = rule

    switch (trigger.type) {
      case 'new_member':
        return event.type === 'new_member'

      case 'keyword':
        if (!event.content) return false
        return event.content.toLowerCase().includes(trigger.value.toLowerCase())

      case 'regex':
        if (!event.content) return false
        try {
          return new RegExp(trigger.value, 'i').test(event.content)
        } catch {
          return false
        }

      case 'inactivity':
        // Inactivity triggers are handled by a scheduled check, not per-message
        return false

      case 'schedule':
        // Schedule triggers are handled by the background task, not per-event
        return false

      default:
        return false
    }
  }
}

function mapActionType(type: string): AgentAction['actionType'] {
  switch (type) {
    case 'reply': return 'replied'
    case 'dm': return 'replied'
    case 'post': return 'scheduled'
    case 'moderate': return 'moderated'
    case 'escalate': return 'escalated'
    default: return 'replied'
  }
}

function interpolateTemplate(template: string, event: AutomationEvent): string {
  return template
    .replace(/\{username\}/g, event.username)
    .replace(/\{platform\}/g, event.platform)
    .replace(/\{message\}/g, event.content ?? '')
}
