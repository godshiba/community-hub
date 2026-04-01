import type { Platform } from './settings-types'

/** Agent running state */
export type AgentRunState = 'running' | 'paused' | 'unavailable'

/** When the agent should respond to messages */
export type AgentRespondMode = 'mentioned' | 'always' | 'never'

/** Agent status returned to renderer */
export interface AgentStatus {
  state: AgentRunState
  provider: string | null
  respondMode: AgentRespondMode
  actionsToday: number
  pendingApproval: number
}

/** Agent profile — persistent identity the AI assumes */
export interface AgentProfile {
  id: number
  name: string
  role: string | null
  tone: string | null
  knowledge: string | null
  boundaries: string | null
  language: string
  respondMode: AgentRespondMode
  updatedAt: string
}

/** Payload for creating/updating the agent profile */
export interface AgentProfilePayload {
  name: string
  role?: string
  tone?: string
  knowledge?: string
  boundaries?: string
  language?: string
  respondMode?: AgentRespondMode
}

/** Trigger types for automation rules */
export type TriggerType = 'new_member' | 'keyword' | 'schedule' | 'inactivity' | 'regex'

/** Action types for automation rules */
export type AutomationActionType = 'reply' | 'dm' | 'post' | 'moderate' | 'escalate'

/** Automation rule trigger definition */
export interface AutomationTrigger {
  type: TriggerType
  value: string
  conditions?: Record<string, unknown>
}

/** Automation rule action definition */
export interface AutomationAction {
  type: AutomationActionType
  payload?: Record<string, unknown>
}

/** Stored automation rule */
export interface AgentAutomation {
  id: number
  name: string
  trigger: AutomationTrigger
  action: AutomationAction
  platform: Platform | null
  enabled: boolean
  lastTriggered: string | null
  createdAt: string
}

/** Payload for creating/updating an automation rule */
export interface AgentAutomationPayload {
  name: string
  trigger: AutomationTrigger
  action: AutomationAction
  platform?: Platform | null
  enabled?: boolean
}

/** Trigger types for response patterns */
export type PatternTriggerType = 'keyword' | 'regex' | 'intent'

/** Stored response pattern */
export interface AgentPattern {
  id: number
  triggerType: PatternTriggerType
  triggerValue: string
  responseTemplate: string
  platform: Platform | null
  enabled: boolean
  usageCount: number
  lastUsed: string | null
  createdAt: string
}

/** Payload for creating/updating a response pattern */
export interface AgentPatternPayload {
  triggerType: PatternTriggerType
  triggerValue: string
  responseTemplate: string
  platform?: Platform | null
  enabled?: boolean
}

/** Agent action types logged in the action feed */
export type AgentActionType = 'replied' | 'flagged' | 'welcomed' | 'scheduled' | 'moderated' | 'escalated'

/** Agent action status */
export type AgentActionStatus = 'completed' | 'pending' | 'approved' | 'rejected' | 'edited'

/** Stored agent action */
export interface AgentAction {
  id: number
  actionType: AgentActionType
  platform: Platform
  context: string | null
  input: string | null
  output: string | null
  status: AgentActionStatus
  correction: string | null
  createdAt: string
}

/** Filter for querying agent actions */
export interface AgentActionsFilter {
  actionType?: AgentActionType
  platform?: Platform
  status?: AgentActionStatus
  limit?: number
  offset?: number
}

/** Payload for editing a pending action before approval */
export interface AgentEditActionPayload {
  id: number
  output: string
}
