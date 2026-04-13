import type { Platform } from './settings-types'

// ---------------------------------------------------------------------------
// Intent Classification
// ---------------------------------------------------------------------------

export type IntentType =
  | 'question'
  | 'request'
  | 'complaint'
  | 'greeting'
  | 'follow_up'
  | 'off_topic'
  | 'feedback'

export interface IntentClassification {
  intent: IntentType
  confidence: number
  needsKnowledge: boolean
  needsUserHistory: boolean
  isUrgent: boolean
}

// ---------------------------------------------------------------------------
// Agent Actions (decided by the reasoning engine)
// ---------------------------------------------------------------------------

export type AgentDecidedActionType =
  | 'search_knowledge'
  | 'lookup_member'
  | 'escalate'
  | 'assign_role'
  | 'create_reminder'
  | 'tag_moderator'
  | 'none'

export interface AgentDecidedAction {
  type: AgentDecidedActionType
  params: Record<string, unknown>
  result?: string
}

// ---------------------------------------------------------------------------
// Agent Reasoning
// ---------------------------------------------------------------------------

export interface AgentReasoningResult {
  thought: string
  response: string
  actions: readonly AgentDecidedAction[]
  memoryUpdates: readonly string[]
  confidence: number
}

// ---------------------------------------------------------------------------
// User Memory
// ---------------------------------------------------------------------------

export interface UserMemory {
  id: number
  platform: Platform
  platformUserId: string
  username: string
  firstInteraction: string
  lastInteraction: string
  interactionCount: number
  primaryLanguage: string | null
  expertiseLevel: string | null
  facts: readonly string[]
  conversationSummary: string | null
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Conversation Turns
// ---------------------------------------------------------------------------

export interface ConversationTurn {
  id: number
  platform: Platform
  platformUserId: string
  channelId: string
  userMessage: string
  agentResponse: string
  intent: IntentType | null
  knowledgeEntryIds: readonly number[]
  actions: readonly AgentDecidedAction[]
  thought: string | null
  confidence: number | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Assembled Context (for the reasoning engine)
// ---------------------------------------------------------------------------

export interface AssembledContext {
  userProfile: string
  conversationHistory: string
  knowledgeContext: string
  memberProfile: string | null
  channelContext: string | null
  availableActions: string
}
