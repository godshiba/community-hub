import type { SpamActionType, SpamRuleType, FloodConfig } from '@shared/spam-types'
import * as repo from './spam.repository'

// ---------------------------------------------------------------------------
// In-memory tracking per user
// ---------------------------------------------------------------------------

interface TrackedMessage {
  readonly content: string
  readonly timestamp: number
  readonly messageId: string
  readonly channelId: string
}

interface UserTracker {
  readonly messages: readonly TrackedMessage[]
  lastAction: number
}

const userTrackers = new Map<string, UserTracker>()

/** Build a composite key: platform:userId */
function userKey(platform: string, userId: string): string {
  return `${platform}:${userId}`
}

function getTracker(platform: string, userId: string): UserTracker {
  const key = userKey(platform, userId)
  const existing = userTrackers.get(key)
  if (existing) return existing
  const tracker: UserTracker = { messages: [], lastAction: 0 }
  userTrackers.set(key, tracker)
  return tracker
}

function pushMessage(platform: string, userId: string, content: string, messageId: string, channelId: string): UserTracker {
  const key = userKey(platform, userId)
  const tracker = getTracker(platform, userId)
  const now = Date.now()
  // Keep only messages within the largest possible window (60s)
  const cutoff = now - 60_000
  const filtered = tracker.messages.filter((m) => m.timestamp > cutoff)
  const updated: UserTracker = {
    messages: [...filtered, { content, timestamp: now, messageId, channelId }],
    lastAction: tracker.lastAction
  }
  userTrackers.set(key, updated)
  return updated
}

// ---------------------------------------------------------------------------
// Detection result
// ---------------------------------------------------------------------------

export interface SpamMessageRef {
  readonly messageId: string
  readonly channelId: string
}

/** Internal result from individual rule checks (before messageRefs are attached) */
interface RuleMatch {
  readonly triggered: true
  readonly ruleType: SpamRuleType
  readonly ruleName: string
  readonly action: SpamActionType
  readonly muteDurationMinutes: number | null
  readonly reason: string
}

export interface SpamDetection extends RuleMatch {
  /** All messages from this user in the detection window — delete them all */
  readonly messageRefs: readonly SpamMessageRef[]
}

// ---------------------------------------------------------------------------
// Core check — runs all flood rules against a single message
// ---------------------------------------------------------------------------

export function checkMessage(
  platform: string,
  userId: string,
  _username: string,
  channelId: string,
  messageId: string,
  content: string
): SpamDetection | null {
  const config = repo.getSpamConfig()
  if (!config.flood.enabled) return null

  const flood = config.flood
  const tracker = pushMessage(platform, userId, content, messageId, channelId)

  // Skip if we recently actioned this user (5s cooldown)
  if (Date.now() - tracker.lastAction < 5000) return null

  // Collect all message refs from the tracker window for bulk deletion
  const messageRefs: SpamMessageRef[] = tracker.messages.map((m) => ({
    messageId: m.messageId,
    channelId: m.channelId
  }))

  // 1. Message rate limiting
  const rateResult = checkMessageRate(tracker, flood)
  if (rateResult) {
    markActioned(platform, userId)
    return { ...rateResult, messageRefs }
  }

  // 2. Duplicate message detection
  const dupeResult = checkDuplicates(tracker, flood, content)
  if (dupeResult) {
    markActioned(platform, userId)
    return { ...dupeResult, messageRefs }
  }

  // 3. Link spam
  const linkResult = checkLinkSpam(flood, content)
  if (linkResult) {
    markActioned(platform, userId)
    return { ...linkResult, messageRefs }
  }

  // 4. Mention spam
  const mentionResult = checkMentionSpam(flood, content)
  if (mentionResult) {
    markActioned(platform, userId)
    return { ...mentionResult, messageRefs }
  }

  // 5. Emoji flood
  const emojiResult = checkEmojiFlood(flood, content)
  if (emojiResult) {
    markActioned(platform, userId)
    return { ...emojiResult, messageRefs }
  }

  // 6. Caps flood
  const capsResult = checkCapsFlood(flood, content)
  if (capsResult) {
    markActioned(platform, userId)
    return { ...capsResult, messageRefs }
  }

  return null
}

function markActioned(platform: string, userId: string): void {
  const key = userKey(platform, userId)
  const tracker = userTrackers.get(key)
  if (tracker) {
    userTrackers.set(key, { ...tracker, lastAction: Date.now() })
  }
}

// ---------------------------------------------------------------------------
// Individual rule checks
// ---------------------------------------------------------------------------

function checkMessageRate(tracker: UserTracker, flood: FloodConfig): RuleMatch | null {
  const windowMs = flood.messageRateWindowSeconds * 1000
  const cutoff = Date.now() - windowMs
  const recentCount = tracker.messages.filter((m) => m.timestamp > cutoff).length

  if (recentCount >= flood.messageRateLimit) {
    return {
      triggered: true,
      ruleType: 'message_rate',
      ruleName: 'Message rate limit',
      action: flood.defaultAction,
      muteDurationMinutes: flood.defaultMuteDurationMinutes,
      reason: `${recentCount} messages in ${flood.messageRateWindowSeconds}s (limit: ${flood.messageRateLimit})`
    }
  }
  return null
}

function checkDuplicates(tracker: UserTracker, flood: FloodConfig, content: string): RuleMatch | null {
  const windowMs = flood.messageRateWindowSeconds * 1000
  const cutoff = Date.now() - windowMs
  // Compare against all prior messages in window (skip the last one — it's the current message)
  const recent = tracker.messages.filter((m) => m.timestamp > cutoff).slice(0, -1)

  for (const msg of recent) {
    const similarity = computeSimilarity(msg.content, content)
    if (similarity >= flood.duplicateSimilarityThreshold) {
      return {
        triggered: true,
        ruleType: 'duplicate_message',
        ruleName: 'Duplicate message',
        action: flood.defaultAction,
        muteDurationMinutes: flood.defaultMuteDurationMinutes,
        reason: `${similarity}% similarity (threshold: ${flood.duplicateSimilarityThreshold}%)`
      }
    }
  }
  return null
}

function checkLinkSpam(flood: FloodConfig, content: string): RuleMatch | null {
  const urlPattern = /https?:\/\/[^\s]+/gi
  const links = content.match(urlPattern) ?? []

  if (links.length > flood.maxLinksPerMessage) {
    return {
      triggered: true,
      ruleType: 'link_spam',
      ruleName: 'Link spam',
      action: flood.defaultAction,
      muteDurationMinutes: flood.defaultMuteDurationMinutes,
      reason: `${links.length} links (limit: ${flood.maxLinksPerMessage})`
    }
  }
  return null
}

function checkMentionSpam(flood: FloodConfig, content: string): RuleMatch | null {
  // Discord: <@123>, <@!123>, <@&123>. Telegram: @username
  const discordMentions = content.match(/<@[!&]?\d+>/g) ?? []
  const telegramMentions = content.match(/@\w+/g) ?? []
  const totalMentions = discordMentions.length + telegramMentions.length

  if (totalMentions > flood.maxMentionsPerMessage) {
    return {
      triggered: true,
      ruleType: 'mention_spam',
      ruleName: 'Mention spam',
      action: flood.defaultAction,
      muteDurationMinutes: flood.defaultMuteDurationMinutes,
      reason: `${totalMentions} mentions (limit: ${flood.maxMentionsPerMessage})`
    }
  }
  return null
}

function checkEmojiFlood(flood: FloodConfig, content: string): RuleMatch | null {
  // Match unicode emoji + Discord custom emoji <:name:id>
  const unicodeEmoji = content.match(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu) ?? []
  const customEmoji = content.match(/<a?:\w+:\d+>/g) ?? []
  const totalEmoji = unicodeEmoji.length + customEmoji.length

  if (totalEmoji > flood.maxEmojiPerMessage) {
    return {
      triggered: true,
      ruleType: 'emoji_flood',
      ruleName: 'Emoji flood',
      action: flood.defaultAction,
      muteDurationMinutes: flood.defaultMuteDurationMinutes,
      reason: `${totalEmoji} emoji (limit: ${flood.maxEmojiPerMessage})`
    }
  }
  return null
}

function checkCapsFlood(flood: FloodConfig, content: string): RuleMatch | null {
  const letters = content.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 10) return null // Ignore short messages

  const upper = letters.replace(/[^A-Z]/g, '').length
  const capsPercent = Math.round((upper / letters.length) * 100)

  if (capsPercent > flood.maxCapsPercent) {
    return {
      triggered: true,
      ruleType: 'caps_flood',
      ruleName: 'Caps flood',
      action: flood.defaultAction,
      muteDurationMinutes: flood.defaultMuteDurationMinutes,
      reason: `${capsPercent}% caps (limit: ${flood.maxCapsPercent}%)`
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Similarity (simple bigram-based Dice coefficient)
// ---------------------------------------------------------------------------

function bigrams(str: string): Set<string> {
  const s = str.toLowerCase()
  const result = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.slice(i, i + 2))
  }
  return result
}

export function computeSimilarity(a: string, b: string): number {
  if (a === b) return 100
  if (a.length < 2 || b.length < 2) return 0

  const bigramsA = bigrams(a)
  const bigramsB = bigrams(b)
  let intersect = 0
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersect++
  }
  return Math.round((2 * intersect * 100) / (bigramsA.size + bigramsB.size))
}

// ---------------------------------------------------------------------------
// Test a rule against sample content (for UI preview)
// ---------------------------------------------------------------------------

export function testRule(ruleType: string, content: string): { triggered: boolean; reason: string } {
  const config = repo.getSpamConfig()
  const flood = config.flood

  switch (ruleType) {
    case 'link_spam': {
      const r = checkLinkSpam(flood, content)
      return r ? { triggered: true, reason: r.reason } : { triggered: false, reason: 'No links detected above threshold' }
    }
    case 'mention_spam': {
      const r = checkMentionSpam(flood, content)
      return r ? { triggered: true, reason: r.reason } : { triggered: false, reason: 'No mention spam detected' }
    }
    case 'emoji_flood': {
      const r = checkEmojiFlood(flood, content)
      return r ? { triggered: true, reason: r.reason } : { triggered: false, reason: 'No emoji flood detected' }
    }
    case 'caps_flood': {
      const r = checkCapsFlood(flood, content)
      return r ? { triggered: true, reason: r.reason } : { triggered: false, reason: 'No caps flood detected' }
    }
    default:
      return { triggered: false, reason: `Rule type '${ruleType}' cannot be tested with static content` }
  }
}

// ---------------------------------------------------------------------------
// Reset (for testing)
// ---------------------------------------------------------------------------

export function resetTrackers(): void {
  userTrackers.clear()
}

// ---------------------------------------------------------------------------
// Cleanup — flush old trackers every 5 minutes
// ---------------------------------------------------------------------------

const CLEANUP_INTERVAL = 5 * 60 * 1000
const MAX_TRACKER_AGE = 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [key, tracker] of userTrackers) {
    const latest = tracker.messages.at(-1)?.timestamp ?? 0
    if (now - latest > MAX_TRACKER_AGE) {
      userTrackers.delete(key)
    }
  }
}, CLEANUP_INTERVAL)
