import { getDatabase } from './database.service'
import type { RoleRule, RoleRulePayload, RoleAssignment } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface RuleRow {
  id: number
  platform: string
  rule_type: string
  role_id: string
  role_name: string
  duration_hours: number | null
  enabled: number
  created_at: string
  updated_at: string
}

interface AssignmentRow {
  id: number
  member_id: number
  platform: string
  role_id: string
  role_name: string
  assigned_at: string
  expires_at: string | null
  expired: number
  username?: string
}

// ---------------------------------------------------------------------------
// Row to domain mappers
// ---------------------------------------------------------------------------

function rowToRule(row: RuleRow): RoleRule {
  return {
    id: row.id,
    platform: row.platform as Platform,
    ruleType: row.rule_type as RoleRule['ruleType'],
    roleId: row.role_id,
    roleName: row.role_name,
    durationHours: row.duration_hours,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToAssignment(row: AssignmentRow): RoleAssignment {
  return {
    id: row.id,
    memberId: row.member_id,
    memberUsername: row.username ?? '',
    platform: row.platform as Platform,
    roleId: row.role_id,
    roleName: row.role_name,
    assignedAt: row.assigned_at,
    expiresAt: row.expires_at,
    expired: row.expired === 1
  }
}

// ---------------------------------------------------------------------------
// Role Rules CRUD
// ---------------------------------------------------------------------------

export function getRules(): readonly RoleRule[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM role_rules ORDER BY created_at DESC').all() as RuleRow[]
  return rows.map(rowToRule)
}

export function saveRule(payload: RoleRulePayload & { id?: number }): RoleRule {
  const db = getDatabase()

  if (payload.id) {
    db.prepare(`
      UPDATE role_rules
      SET platform = ?, rule_type = ?, role_id = ?, role_name = ?, duration_hours = ?, enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(payload.platform, payload.ruleType, payload.roleId, payload.roleName, payload.durationHours, payload.enabled ? 1 : 0, payload.id)
    return rowToRule(db.prepare('SELECT * FROM role_rules WHERE id = ?').get(payload.id) as RuleRow)
  }

  const result = db.prepare(`
    INSERT INTO role_rules (platform, rule_type, role_id, role_name, duration_hours, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(payload.platform, payload.ruleType, payload.roleId, payload.roleName, payload.durationHours, payload.enabled ? 1 : 0)

  return rowToRule(db.prepare('SELECT * FROM role_rules WHERE id = ?').get(Number(result.lastInsertRowid)) as RuleRow)
}

export function deleteRule(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM role_rules WHERE id = ?').run(id)
}

export function toggleRule(id: number, enabled: boolean): void {
  const db = getDatabase()
  db.prepare('UPDATE role_rules SET enabled = ?, updated_at = datetime(\'now\') WHERE id = ?').run(enabled ? 1 : 0, id)
}

export function getAutoAssignRules(platform: Platform): readonly RoleRule[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM role_rules WHERE platform = ? AND rule_type = ? AND enabled = 1'
  ).all(platform, 'auto_assign') as RuleRow[]
  return rows.map(rowToRule)
}

// ---------------------------------------------------------------------------
// Role Assignments
// ---------------------------------------------------------------------------

export function getAssignments(memberId?: number): readonly RoleAssignment[] {
  const db = getDatabase()

  const query = memberId
    ? `SELECT ra.*, cm.username FROM role_assignments ra
       LEFT JOIN community_members cm ON cm.id = ra.member_id
       WHERE ra.member_id = ? ORDER BY ra.assigned_at DESC`
    : `SELECT ra.*, cm.username FROM role_assignments ra
       LEFT JOIN community_members cm ON cm.id = ra.member_id
       WHERE ra.expired = 0 ORDER BY ra.assigned_at DESC`

  const rows = memberId
    ? db.prepare(query).all(memberId) as AssignmentRow[]
    : db.prepare(query).all() as AssignmentRow[]

  return rows.map(rowToAssignment)
}

export function createAssignment(
  memberId: number,
  platform: Platform,
  roleId: string,
  roleName: string,
  durationHours: number | null
): RoleAssignment {
  const db = getDatabase()

  const expiresAt = durationHours
    ? `datetime('now', '+${Math.round(durationHours)} hours')`
    : null

  const result = db.prepare(`
    INSERT INTO role_assignments (member_id, platform, role_id, role_name, expires_at)
    VALUES (?, ?, ?, ?, ${expiresAt ? expiresAt : 'NULL'})
  `).run(memberId, platform, roleId, roleName)

  const row = db.prepare(
    `SELECT ra.*, cm.username FROM role_assignments ra
     LEFT JOIN community_members cm ON cm.id = ra.member_id
     WHERE ra.id = ?`
  ).get(Number(result.lastInsertRowid)) as AssignmentRow

  return rowToAssignment(row)
}

export function removeAssignment(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM role_assignments WHERE id = ?').run(id)
}

export function getExpiredAssignments(): readonly RoleAssignment[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT ra.*, cm.username FROM role_assignments ra
    LEFT JOIN community_members cm ON cm.id = ra.member_id
    WHERE ra.expired = 0 AND ra.expires_at IS NOT NULL AND ra.expires_at <= datetime('now')
  `).all() as AssignmentRow[]
  return rows.map(rowToAssignment)
}

export function markExpired(id: number): void {
  const db = getDatabase()
  db.prepare('UPDATE role_assignments SET expired = 1 WHERE id = ?').run(id)
}
