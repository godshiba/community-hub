import { getDatabase } from './database.service'
import type {
  CommunityMember,
  MemberWarning,
  MemberAction,
  MemberDetail,
  MembersFilter,
  MembersPage,
  MemberStatus,
  ExportResult
} from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface MemberRow {
  id: number
  username: string
  platform: string
  platform_user_id: string
  join_date: string | null
  status: string
  reputation_score: number
  warnings_count: number
  notes: string | null
  last_activity: string | null
  created_at: string
}

interface WarningRow {
  id: number
  member_id: number
  reason: string
  given_by: string | null
  given_at: string
  resolved: number
  resolved_at: string | null
}

interface ActionRow {
  id: number
  member_id: number
  action_type: string
  reason: string | null
  executed_by: string | null
  executed_at: string
}

// ---------------------------------------------------------------------------
// Row to domain mappers
// ---------------------------------------------------------------------------

function rowToMember(row: MemberRow): CommunityMember {
  return {
    id: row.id,
    username: row.username,
    platform: row.platform as Platform,
    platformUserId: row.platform_user_id,
    joinDate: row.join_date,
    status: row.status as MemberStatus,
    reputationScore: row.reputation_score,
    warningsCount: row.warnings_count,
    notes: row.notes,
    lastActivity: row.last_activity,
    createdAt: row.created_at
  }
}

function rowToWarning(row: WarningRow): MemberWarning {
  return {
    id: row.id,
    memberId: row.member_id,
    reason: row.reason,
    givenBy: row.given_by,
    givenAt: row.given_at,
    resolved: row.resolved === 1,
    resolvedAt: row.resolved_at
  }
}

function rowToAction(row: ActionRow): MemberAction {
  return {
    id: row.id,
    memberId: row.member_id,
    actionType: row.action_type,
    reason: row.reason,
    executedBy: row.executed_by,
    executedAt: row.executed_at
  }
}

// ---------------------------------------------------------------------------
// Members CRUD
// ---------------------------------------------------------------------------

export function getMembers(filter: MembersFilter): MembersPage {
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
  if (filter.search) {
    conditions.push('username LIKE ?')
    params.push(`%${filter.search}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const allowedColumns = ['username', 'platform', 'status', 'join_date', 'message_count', 'warning_count'] as const
  const allowedDirs = ['asc', 'desc'] as const
  const sortBy = allowedColumns.includes(filter.sortBy as typeof allowedColumns[number])
    ? filter.sortBy!
    : 'username'
  const sortDir = allowedDirs.includes(filter.sortDir as typeof allowedDirs[number])
    ? filter.sortDir!
    : 'asc'
  const orderBy = `ORDER BY ${sortBy} ${sortDir}`

  const page = filter.page ?? 1
  const pageSize = filter.pageSize ?? 50
  const offset = (page - 1) * pageSize

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM community_members ${where}`).get(...params) as { total: number }
  const rows = db.prepare(
    `SELECT * FROM community_members ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset) as MemberRow[]

  return {
    members: rows.map(rowToMember),
    total: countRow.total,
    page,
    pageSize
  }
}

export function getMemberById(id: number): CommunityMember | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM community_members WHERE id = ?').get(id) as MemberRow | undefined
  return row ? rowToMember(row) : undefined
}

export function getMemberDetail(id: number): MemberDetail {
  const member = getMemberById(id)
  if (!member) throw new Error(`Member ${id} not found`)

  const db = getDatabase()
  const warnings = (db.prepare(
    'SELECT * FROM member_warnings WHERE member_id = ? ORDER BY given_at DESC'
  ).all(id) as WarningRow[]).map(rowToWarning)

  const actions = (db.prepare(
    'SELECT * FROM member_actions WHERE member_id = ? ORDER BY executed_at DESC'
  ).all(id) as ActionRow[]).map(rowToAction)

  return { member, warnings, actions }
}

export function getMemberByPlatformId(platform: string, platformUserId: string): CommunityMember | undefined {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM community_members WHERE platform = ? AND platform_user_id = ?'
  ).get(platform, platformUserId) as MemberRow | undefined
  return row ? rowToMember(row) : undefined
}

// ---------------------------------------------------------------------------
// Upsert (for sync)
// ---------------------------------------------------------------------------

export function upsertMember(
  platform: string,
  platformUserId: string,
  username: string,
  joinDate: string | null,
  status: MemberStatus = 'active'
): CommunityMember {
  const db = getDatabase()

  db.prepare(`
    INSERT INTO community_members (username, platform, platform_user_id, join_date, status, last_activity)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(platform, platform_user_id) DO UPDATE SET
      username = excluded.username,
      status = excluded.status,
      last_activity = datetime('now'),
      updated_at = datetime('now')
  `).run(username, platform, platformUserId, joinDate, status)

  return getMemberByPlatformId(platform, platformUserId)!
}

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

export function addWarning(memberId: number, reason: string, givenBy?: string): MemberWarning {
  const db = getDatabase()

  const result = db.prepare(`
    INSERT INTO member_warnings (member_id, reason, given_by)
    VALUES (?, ?, ?)
  `).run(memberId, reason, givenBy ?? null)

  db.prepare(`
    UPDATE community_members
    SET warnings_count = warnings_count + 1, status = 'warned', updated_at = datetime('now')
    WHERE id = ?
  `).run(memberId)

  logAction(memberId, 'warn', reason, givenBy)

  const row = db.prepare('SELECT * FROM member_warnings WHERE id = ?').get(
    Number(result.lastInsertRowid)
  ) as WarningRow
  return rowToWarning(row)
}

// ---------------------------------------------------------------------------
// Ban / Unban
// ---------------------------------------------------------------------------

export function banMember(memberId: number, reason: string): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE community_members SET status = 'banned', updated_at = datetime('now') WHERE id = ?
  `).run(memberId)
  logAction(memberId, 'ban', reason)
}

export function kickMember(memberId: number, reason: string): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE community_members SET status = 'left', updated_at = datetime('now') WHERE id = ?
  `).run(memberId)
  logAction(memberId, 'kick', reason)
}

export function unbanMember(memberId: number): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE community_members SET status = 'active', updated_at = datetime('now') WHERE id = ?
  `).run(memberId)
  logAction(memberId, 'unban', null)
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export function updateNotes(memberId: number, notes: string): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE community_members SET notes = ?, updated_at = datetime('now') WHERE id = ?
  `).run(notes, memberId)
  logAction(memberId, 'note', notes)
}

// ---------------------------------------------------------------------------
// Actions log
// ---------------------------------------------------------------------------

function logAction(memberId: number, actionType: string, reason: string | null, executedBy?: string): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO member_actions (member_id, action_type, reason, executed_by)
    VALUES (?, ?, ?, ?)
  `).run(memberId, actionType, reason, executedBy ?? null)
}

// ---------------------------------------------------------------------------
// Mark stale members as 'left'
// ---------------------------------------------------------------------------

export function markAbsentMembersAsLeft(platform: string, activePlatformUserIds: ReadonlySet<string>): number {
  const db = getDatabase()
  const rows = db.prepare(
    "SELECT id, platform_user_id FROM community_members WHERE platform = ? AND status IN ('active', 'warned')"
  ).all(platform) as { id: number; platform_user_id: string }[]

  let marked = 0
  for (const row of rows) {
    if (!activePlatformUserIds.has(row.platform_user_id)) {
      db.prepare("UPDATE community_members SET status = 'left', updated_at = datetime('now') WHERE id = ?").run(row.id)
      marked++
    }
  }
  return marked
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function exportMembers(filter: MembersFilter): ExportResult {
  const { members } = getMembers({ ...filter, page: 1, pageSize: 10000 })

  const header = 'id,username,platform,platform_user_id,status,reputation_score,warnings_count,join_date,last_activity'
  const lines = members.map((m) =>
    [m.id, m.username, m.platform, m.platformUserId, m.status, m.reputationScore, m.warningsCount, m.joinDate ?? '', m.lastActivity ?? ''].join(',')
  )

  return {
    csv: [header, ...lines].join('\n'),
    count: members.length
  }
}
