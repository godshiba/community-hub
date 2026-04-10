import type { Platform } from './settings-types'

// ---------------------------------------------------------------------------
// Content classification categories
// ---------------------------------------------------------------------------

export type ContentCategory =
  | 'clean'
  | 'toxic'
  | 'nsfw_text'
  | 'spam'
  | 'scam'
  | 'harassment'
  | 'hate_speech'
  | 'self_harm'

export const ALL_CONTENT_CATEGORIES: readonly ContentCategory[] = [
  'clean',
  'toxic',
  'nsfw_text',
  'spam',
  'scam',
  'harassment',
  'hate_speech',
  'self_harm'
] as const

export type CategoryScore = {
  readonly category: ContentCategory
  readonly score: number
}

export interface ContentClassification {
  readonly primaryCategory: ContentCategory
  readonly scores: readonly CategoryScore[]
  readonly confidence: number
  readonly reasoning: string
}

// ---------------------------------------------------------------------------
// Policy actions
// ---------------------------------------------------------------------------

export type ContentActionType = 'ignore' | 'flag' | 'delete' | 'warn' | 'mute' | 'ban'

export interface CategoryPolicy {
  readonly category: ContentCategory
  readonly threshold: number
  readonly action: ContentActionType
}

export interface ModerationPolicy {
  readonly id: number
  readonly name: string
  readonly enabled: boolean
  readonly platform: Platform | 'all'
  readonly classificationMode: ClassificationMode
  readonly testMode: boolean
  readonly categories: readonly CategoryPolicy[]
  readonly createdAt: string
  readonly updatedAt: string
}

export type ClassificationMode = 'all' | 'suspicious'

export interface ModerationPolicyPayload {
  readonly name: string
  readonly enabled: boolean
  readonly platform: Platform | 'all'
  readonly classificationMode: ClassificationMode
  readonly testMode: boolean
  readonly categories: readonly CategoryPolicy[]
}

// ---------------------------------------------------------------------------
// Content flags (flagged messages)
// ---------------------------------------------------------------------------

export type FlagStatus = 'pending' | 'approved' | 'dismissed' | 'actioned'

export interface ContentFlag {
  readonly id: number
  readonly platform: Platform
  readonly userId: string
  readonly username: string
  readonly channelId: string
  readonly messageId: string | null
  readonly messageContent: string
  readonly classification: ContentClassification
  readonly policyAction: ContentActionType
  readonly status: FlagStatus
  readonly reviewedBy: string | null
  readonly reviewedAt: string | null
  readonly actionExecuted: boolean
  readonly createdAt: string
}

export interface ContentFlagFilter {
  readonly platform?: Platform
  readonly status?: FlagStatus
  readonly category?: ContentCategory
  readonly limit?: number
  readonly offset?: number
}

export interface ReviewFlagPayload {
  readonly flagId: number
  readonly decision: 'approve' | 'dismiss' | 'action'
}

// ---------------------------------------------------------------------------
// Default policy
// ---------------------------------------------------------------------------

export const DEFAULT_CATEGORY_POLICIES: readonly CategoryPolicy[] = [
  { category: 'clean', threshold: 1.0, action: 'ignore' },
  { category: 'toxic', threshold: 0.7, action: 'flag' },
  { category: 'nsfw_text', threshold: 0.7, action: 'flag' },
  { category: 'spam', threshold: 0.8, action: 'delete' },
  { category: 'scam', threshold: 0.7, action: 'delete' },
  { category: 'harassment', threshold: 0.7, action: 'warn' },
  { category: 'hate_speech', threshold: 0.6, action: 'flag' },
  { category: 'self_harm', threshold: 0.5, action: 'flag' }
] as const
