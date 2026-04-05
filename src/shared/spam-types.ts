import type { Platform } from './settings-types'

// ---------------------------------------------------------------------------
// Spam rule configuration
// ---------------------------------------------------------------------------

export type SpamActionType = 'delete' | 'warn' | 'mute' | 'kick' | 'ban'

export interface SpamRule {
  readonly id: number
  readonly name: string
  readonly enabled: boolean
  readonly platform: Platform | 'all'
  readonly ruleType: SpamRuleType
  readonly threshold: number
  readonly windowSeconds: number
  readonly action: SpamActionType
  readonly muteDurationMinutes: number | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type SpamRuleType =
  | 'message_rate'
  | 'duplicate_message'
  | 'link_spam'
  | 'mention_spam'
  | 'emoji_flood'
  | 'caps_flood'

export interface SpamRulePayload {
  readonly name: string
  readonly enabled: boolean
  readonly platform: Platform | 'all'
  readonly ruleType: SpamRuleType
  readonly threshold: number
  readonly windowSeconds: number
  readonly action: SpamActionType
  readonly muteDurationMinutes: number | null
}

// ---------------------------------------------------------------------------
// Spam events (logged detections)
// ---------------------------------------------------------------------------

export interface SpamEvent {
  readonly id: number
  readonly platform: Platform
  readonly userId: string
  readonly username: string
  readonly channelId: string
  readonly ruleType: SpamRuleType
  readonly ruleName: string
  readonly actionTaken: SpamActionType
  readonly messageContent: string | null
  readonly detectedAt: string
}

export interface SpamEventsFilter {
  readonly platform?: Platform
  readonly ruleType?: SpamRuleType
  readonly limit?: number
  readonly offset?: number
}

// ---------------------------------------------------------------------------
// Raid detection
// ---------------------------------------------------------------------------

export type RaidState = 'normal' | 'suspected' | 'active' | 'cooldown'

export interface RaidEvent {
  readonly id: number
  readonly platform: Platform
  readonly state: RaidState
  readonly joinCount: number
  readonly windowSeconds: number
  readonly actionsTaken: string
  readonly startedAt: string
  readonly resolvedAt: string | null
}

export interface RaidConfig {
  readonly enabled: boolean
  readonly joinThreshold: number
  readonly joinWindowSeconds: number
  readonly minAccountAgeDays: number
  readonly autoSlowmode: boolean
  readonly autoLockdown: boolean
  readonly autoBanNewAccounts: boolean
  readonly notifyOwner: boolean
}

export interface FloodConfig {
  readonly enabled: boolean
  readonly messageRateLimit: number
  readonly messageRateWindowSeconds: number
  readonly duplicateSimilarityThreshold: number
  readonly maxLinksPerMessage: number
  readonly maxMentionsPerMessage: number
  readonly maxEmojiPerMessage: number
  readonly maxCapsPercent: number
  readonly defaultAction: SpamActionType
  readonly defaultMuteDurationMinutes: number
}

export interface SpamConfig {
  readonly flood: FloodConfig
  readonly raid: RaidConfig
}

// ---------------------------------------------------------------------------
// Default configurations
// ---------------------------------------------------------------------------

export const DEFAULT_FLOOD_CONFIG: FloodConfig = {
  enabled: true,
  messageRateLimit: 5,
  messageRateWindowSeconds: 10,
  duplicateSimilarityThreshold: 80,
  maxLinksPerMessage: 3,
  maxMentionsPerMessage: 5,
  maxEmojiPerMessage: 15,
  maxCapsPercent: 70,
  defaultAction: 'mute',
  defaultMuteDurationMinutes: 10
}

export const DEFAULT_RAID_CONFIG: RaidConfig = {
  enabled: true,
  joinThreshold: 10,
  joinWindowSeconds: 30,
  minAccountAgeDays: 7,
  autoSlowmode: true,
  autoLockdown: false,
  autoBanNewAccounts: false,
  notifyOwner: true
}

export const DEFAULT_SPAM_CONFIG: SpamConfig = {
  flood: DEFAULT_FLOOD_CONFIG,
  raid: DEFAULT_RAID_CONFIG
}
