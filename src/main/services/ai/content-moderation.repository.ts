import { getDatabase } from '../database.service'
import type {
  ModerationPolicy,
  ModerationPolicyPayload,
  ContentFlag,
  ContentFlagFilter,
  ContentClassification,
  ContentActionType,
  FlagStatus,
  CategoryPolicy
} from '@shared/content-moderation-types'
import { DEFAULT_CATEGORY_POLICIES } from '@shared/content-moderation-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface PolicyRow {
  id: number
  name: string
  enabled: number
  platform: string
  classification_mode: string
  test_mode: number
  categories: string
  created_at: string
  updated_at: string
}

interface FlagRow {
  id: number
  platform: string
  user_id: string
  username: string
  channel_id: string
  message_id: string | null
  message_content: string
  classification: string
  policy_action: string
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  action_executed: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToPolicy(row: PolicyRow): ModerationPolicy {
  let categories: readonly CategoryPolicy[]
  try {
    categories = JSON.parse(row.categories) as CategoryPolicy[]
  } catch {
    categories = [...DEFAULT_CATEGORY_POLICIES]
  }
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === 1,
    platform: row.platform as ModerationPolicy['platform'],
    classificationMode: row.classification_mode as ModerationPolicy['classificationMode'],
    testMode: row.test_mode === 1,
    categories,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToFlag(row: FlagRow): ContentFlag {
  let classification: ContentClassification
  try {
    classification = JSON.parse(row.classification) as ContentClassification
  } catch {
    classification = {
      primaryCategory: 'clean',
      scores: [],
      confidence: 0,
      reasoning: 'Parse error'
    }
  }
  return {
    id: row.id,
    platform: row.platform as Platform,
    userId: row.user_id,
    username: row.username,
    channelId: row.channel_id,
    messageId: row.message_id,
    messageContent: row.message_content,
    classification,
    policyAction: row.policy_action as ContentActionType,
    status: row.status as FlagStatus,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    actionExecuted: row.action_executed === 1,
    createdAt: row.created_at
  }
}

// ---------------------------------------------------------------------------
// Policy CRUD
// ---------------------------------------------------------------------------

export function getPolicy(): ModerationPolicy | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM moderation_policies ORDER BY id DESC LIMIT 1').get() as PolicyRow | undefined
  return row ? rowToPolicy(row) : null
}

export function savePolicy(payload: ModerationPolicyPayload & { id?: number }): ModerationPolicy {
  const db = getDatabase()
  const categoriesJson = JSON.stringify(payload.categories)

  if (payload.id) {
    db.prepare(`
      UPDATE moderation_policies SET name = ?, enabled = ?, platform = ?,
        classification_mode = ?, test_mode = ?, categories = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      payload.name, payload.enabled ? 1 : 0, payload.platform,
      payload.classificationMode, payload.testMode ? 1 : 0, categoriesJson,
      payload.id
    )
    const row = db.prepare('SELECT * FROM moderation_policies WHERE id = ?').get(payload.id) as PolicyRow
    return rowToPolicy(row)
  }

  const result = db.prepare(`
    INSERT INTO moderation_policies (name, enabled, platform, classification_mode, test_mode, categories)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    payload.name, payload.enabled ? 1 : 0, payload.platform,
    payload.classificationMode, payload.testMode ? 1 : 0, categoriesJson
  )
  const row = db.prepare('SELECT * FROM moderation_policies WHERE id = ?').get(Number(result.lastInsertRowid)) as PolicyRow
  return rowToPolicy(row)
}

// ---------------------------------------------------------------------------
// Flag CRUD
// ---------------------------------------------------------------------------

export function createFlag(flag: {
  platform: Platform
  userId: string
  username: string
  channelId: string
  messageId: string | null
  messageContent: string
  classification: ContentClassification
  policyAction: ContentActionType
}): ContentFlag {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO content_flags (platform, user_id, username, channel_id, message_id,
      message_content, classification, policy_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    flag.platform, flag.userId, flag.username, flag.channelId,
    flag.messageId, flag.messageContent,
    JSON.stringify(flag.classification), flag.policyAction
  )
  const row = db.prepare('SELECT * FROM content_flags WHERE id = ?').get(Number(result.lastInsertRowid)) as FlagRow
  return rowToFlag(row)
}

export function getFlags(filter: ContentFlagFilter): readonly ContentFlag[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.platform) {
    conditions.push('platform = ?')
    params.push(filter.platform)
  }
  if (filter.status) {
    conditions.push('status = ?')
    params.push(filter.status)
  }
  if (filter.category) {
    conditions.push("json_extract(classification, '$.primaryCategory') = ?")
    params.push(filter.category)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filter.limit ?? 100
  const offset = filter.offset ?? 0

  const rows = db.prepare(
    `SELECT * FROM content_flags ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as FlagRow[]

  return rows.map(rowToFlag)
}

export function reviewFlag(flagId: number, decision: 'approve' | 'dismiss' | 'action', reviewer: string = 'admin'): void {
  const db = getDatabase()
  const statusMap: Record<string, FlagStatus> = {
    approve: 'approved',
    dismiss: 'dismissed',
    action: 'actioned'
  }
  const newStatus = statusMap[decision]
  const actionExecuted = decision === 'action' ? 1 : 0

  db.prepare(`
    UPDATE content_flags SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'),
      action_executed = ?
    WHERE id = ?
  `).run(newStatus, reviewer, actionExecuted, flagId)
}

export function getFlagById(id: number): ContentFlag | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM content_flags WHERE id = ?').get(id) as FlagRow | undefined
  return row ? rowToFlag(row) : null
}
