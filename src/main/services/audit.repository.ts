import { getDatabase } from './database.service'
import type {
  AuditLogEntry,
  AuditFilter,
  AuditPage,
  AuditActionType,
  AuditExportResult
} from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface AuditRow {
  id: number
  timestamp: string
  moderator: string
  moderator_type: string
  target_member_id: number | null
  target_username: string
  action_type: string
  reason: string | null
  platform: string
  metadata: string | null
}

function rowToEntry(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    moderator: row.moderator,
    moderatorType: row.moderator_type as AuditLogEntry['moderatorType'],
    targetMemberId: row.target_member_id,
    targetUsername: row.target_username,
    actionType: row.action_type as AuditActionType,
    reason: row.reason,
    platform: row.platform as Platform,
    metadata: row.metadata
  }
}

// ---------------------------------------------------------------------------
// Log an audit entry
// ---------------------------------------------------------------------------

export interface LogAuditParams {
  readonly moderator: string
  readonly moderatorType: 'human' | 'ai_agent' | 'system'
  readonly targetMemberId: number | null
  readonly targetUsername: string
  readonly actionType: AuditActionType
  readonly reason: string | null
  readonly platform: Platform
  readonly metadata?: Record<string, unknown> | null
}

export function logAuditEntry(params: LogAuditParams): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO moderation_audit_log
      (moderator, moderator_type, target_member_id, target_username, action_type, reason, platform, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.moderator,
    params.moderatorType,
    params.targetMemberId,
    params.targetUsername,
    params.actionType,
    params.reason,
    params.platform,
    params.metadata ? JSON.stringify(params.metadata) : null
  )
}

// ---------------------------------------------------------------------------
// Query audit log
// ---------------------------------------------------------------------------

export function getAuditLog(filter: AuditFilter): AuditPage {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.dateFrom) {
    conditions.push('timestamp >= ?')
    params.push(filter.dateFrom)
  }
  if (filter.dateTo) {
    conditions.push('timestamp <= ?')
    params.push(filter.dateTo)
  }
  if (filter.actionType) {
    conditions.push('action_type = ?')
    params.push(filter.actionType)
  }
  if (filter.moderator) {
    conditions.push('moderator LIKE ?')
    params.push(`%${filter.moderator}%`)
  }
  if (filter.targetUsername) {
    conditions.push('target_username LIKE ?')
    params.push(`%${filter.targetUsername}%`)
  }
  if (filter.platform) {
    conditions.push('platform = ?')
    params.push(filter.platform)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM moderation_audit_log ${where}`
  ).get(...params) as { total: number }

  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0

  const rows = db.prepare(
    `SELECT * FROM moderation_audit_log ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as AuditRow[]

  return {
    entries: rows.map(rowToEntry),
    total: countRow.total
  }
}

// ---------------------------------------------------------------------------
// Get audit entries for a specific member
// ---------------------------------------------------------------------------

export function getMemberAuditLog(memberId: number): readonly AuditLogEntry[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM moderation_audit_log WHERE target_member_id = ? ORDER BY timestamp DESC LIMIT 100'
  ).all(memberId) as AuditRow[]
  return rows.map(rowToEntry)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function exportAuditLog(filter: AuditFilter): AuditExportResult {
  const { entries } = getAuditLog({ ...filter, limit: 10000, offset: 0 })

  const header = 'id,timestamp,moderator,moderator_type,target_username,action_type,reason,platform'
  const lines = entries.map((e) =>
    [
      e.id,
      e.timestamp,
      `"${e.moderator}"`,
      e.moderatorType,
      `"${e.targetUsername}"`,
      e.actionType,
      `"${(e.reason ?? '').replace(/"/g, '""')}"`,
      e.platform
    ].join(',')
  )

  return {
    csv: [header, ...lines].join('\n'),
    count: entries.length
  }
}
