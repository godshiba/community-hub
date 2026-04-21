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

// ---------------------------------------------------------------------------
// Brain Configuration (admin-tunable settings)
// ---------------------------------------------------------------------------

export interface BrainConfig {
  maxActionRounds: number
  confidenceThreshold: number
  maxFactsPerUser: number
  maxContextChars: number
  compactionTurnThreshold: number
  compactionBatchSize: number
  compactionIntervalHours: number
  maxSummaryLength: number
  enabledActions: Record<AgentDecidedActionType, boolean>
  userBlacklist: readonly string[] // "platform:userId" pairs
  customGreetingWords: readonly string[]
  customFollowUpPatterns: readonly string[]
}

export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  maxActionRounds: 2,
  confidenceThreshold: 0.7,
  maxFactsPerUser: 20,
  maxContextChars: 12000,
  compactionTurnThreshold: 50,
  compactionBatchSize: 40,
  compactionIntervalHours: 6,
  maxSummaryLength: 2000,
  enabledActions: {
    search_knowledge: true,
    lookup_member: true,
    escalate: true,
    assign_role: true,
    create_reminder: true,
    tag_moderator: true,
    none: true
  },
  userBlacklist: [],
  customGreetingWords: [],
  customFollowUpPatterns: []
}

// ---------------------------------------------------------------------------
// Memory Stats & User List
// ---------------------------------------------------------------------------

export interface MemoryStats {
  totalUsers: number
  totalTurns: number
  lastCompactionAt: string | null
  averageTurnsPerUser: number
}

export interface MemoryUserEntry {
  id: number
  platform: Platform
  platformUserId: string
  username: string
  interactionCount: number
  lastInteraction: string
  factsCount: number
}
