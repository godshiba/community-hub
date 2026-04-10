import type {
  ContentClassification,
  ContentActionType,
  ModerationPolicy,
  CategoryPolicy
} from '@shared/content-moderation-types'
import { DEFAULT_CATEGORY_POLICIES } from '@shared/content-moderation-types'
import type { Platform } from '@shared/settings-types'
import * as modRepo from './content-moderation.repository'
import { logAuditEntry } from '../audit.repository'
import { getMemberByPlatformId } from '../moderation.repository'

// ---------------------------------------------------------------------------
// Policy evaluation result
// ---------------------------------------------------------------------------

export interface PolicyResult {
  readonly shouldAct: boolean
  readonly action: ContentActionType
  readonly triggeredCategory: string
  readonly triggeredScore: number
  readonly testMode: boolean
}

const NO_ACTION: PolicyResult = {
  shouldAct: false,
  action: 'ignore',
  triggeredCategory: 'clean',
  triggeredScore: 0,
  testMode: false
}

// ---------------------------------------------------------------------------
// Evaluate classification against policy
// ---------------------------------------------------------------------------

export function evaluatePolicy(
  classification: ContentClassification,
  platform: Platform
): PolicyResult {
  const policy = modRepo.getPolicy()
  if (!policy || !policy.enabled) return NO_ACTION
  if (policy.platform !== 'all' && policy.platform !== platform) return NO_ACTION

  const categoryMap = new Map<string, CategoryPolicy>()
  for (const cp of policy.categories) {
    categoryMap.set(cp.category, cp)
  }
  // Fall back to defaults for missing categories
  for (const cp of DEFAULT_CATEGORY_POLICIES) {
    if (!categoryMap.has(cp.category)) {
      categoryMap.set(cp.category, cp)
    }
  }

  let highestAction: ContentActionType = 'ignore'
  let highestPriority = 0
  let triggeredCategory = 'clean'
  let triggeredScore = 0

  const actionPriority: Record<ContentActionType, number> = {
    ignore: 0,
    flag: 1,
    delete: 2,
    warn: 3,
    mute: 4,
    ban: 5
  }

  for (const score of classification.scores) {
    if (score.category === 'clean') continue
    const catPolicy = categoryMap.get(score.category)
    if (!catPolicy || catPolicy.action === 'ignore') continue
    if (score.score >= catPolicy.threshold) {
      const priority = actionPriority[catPolicy.action]
      if (priority > highestPriority) {
        highestPriority = priority
        highestAction = catPolicy.action
        triggeredCategory = score.category
        triggeredScore = score.score
      }
    }
  }

  if (highestAction === 'ignore') return NO_ACTION

  return {
    shouldAct: true,
    action: highestAction,
    triggeredCategory,
    triggeredScore,
    testMode: policy.testMode
  }
}

// ---------------------------------------------------------------------------
// Execute policy action: flag, delete, warn, mute, ban
// ---------------------------------------------------------------------------

export function executePolicyAction(
  result: PolicyResult,
  platform: Platform,
  userId: string,
  username: string,
  channelId: string,
  messageId: string | null,
  messageContent: string,
  classification: ContentClassification
): void {
  // In test mode, always flag instead of executing the action
  const effectiveAction: ContentActionType = result.testMode ? 'flag' : result.action

  // Create flag record
  modRepo.createFlag({
    platform,
    userId,
    username,
    channelId,
    messageId,
    messageContent: messageContent.slice(0, 2000),
    classification,
    policyAction: effectiveAction
  })

  // Log to audit trail
  const member = getMemberByPlatformId(platform, userId)
  logAuditEntry({
    moderator: 'content-mod',
    moderatorType: 'system',
    targetMemberId: member?.id ?? null,
    targetUsername: username,
    actionType: 'content_moderation',
    reason: `${result.triggeredCategory} (${(result.triggeredScore * 100).toFixed(0)}%): ${effectiveAction}${result.testMode ? ' [test mode]' : ''}`,
    platform,
    metadata: {
      category: result.triggeredCategory,
      score: result.triggeredScore,
      action: effectiveAction,
      testMode: result.testMode
    }
  })
}
