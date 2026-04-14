import { getDatabase } from '../database.service'
import type {
  AgentProfile,
  AgentProfilePayload,
  AgentPattern,
  AgentPatternPayload,
  AgentAutomation,
  AgentAutomationPayload,
  AgentAction,
  AgentActionsFilter,
  AgentActionType,
  AgentActionStatus
} from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types (snake_case from SQLite)
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: number
  name: string
  role: string | null
  tone: string | null
  knowledge: string | null
  boundaries: string | null
  language: string
  respond_mode: string
  updated_at: string
}

interface PatternRow {
  id: number
  trigger_type: string
  trigger_value: string
  response_template: string
  platform: string | null
  enabled: number
  usage_count: number
  last_used: string | null
  created_at: string
}

interface AutomationRow {
  id: number
  name: string
  trigger: string
  action: string
  platform: string | null
  enabled: number
  last_triggered: string | null
  created_at: string
}

interface ActionRow {
  id: number
  action_type: string
  platform: string
  context: string | null
  input: string | null
  output: string | null
  status: string
  correction: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Row to domain mappers
// ---------------------------------------------------------------------------

function rowToProfile(row: ProfileRow): AgentProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    tone: row.tone,
    knowledge: row.knowledge,
    boundaries: row.boundaries,
    language: row.language,
    respondMode: (row.respond_mode as AgentProfile['respondMode']) ?? 'mentioned',
    updatedAt: row.updated_at
  }
}

function rowToPattern(row: PatternRow): AgentPattern {
  return {
    id: row.id,
    triggerType: row.trigger_type as AgentPattern['triggerType'],
    triggerValue: row.trigger_value,
    responseTemplate: row.response_template,
    platform: row.platform as Platform | null,
    enabled: row.enabled === 1,
    usageCount: row.usage_count,
    lastUsed: row.last_used,
    createdAt: row.created_at
  }
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function rowToAutomation(row: AutomationRow): AgentAutomation {
  return {
    id: row.id,
    name: row.name,
    trigger: safeParseJson(row.trigger, { type: 'keyword', value: '' }),
    action: safeParseJson(row.action, { type: 'reply', value: '' }),
    platform: row.platform as Platform | null,
    enabled: row.enabled === 1,
    lastTriggered: row.last_triggered,
    createdAt: row.created_at
  }
}

function rowToAction(row: ActionRow): AgentAction {
  return {
    id: row.id,
    actionType: row.action_type as AgentActionType,
    platform: row.platform as Platform,
    context: row.context,
    input: row.input,
    output: row.output,
    status: row.status as AgentActionStatus,
    correction: row.correction,
    createdAt: row.created_at
  }
}

// ---------------------------------------------------------------------------
// Profile CRUD
// ---------------------------------------------------------------------------

export function getProfile(): AgentProfile | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM agent_profile LIMIT 1').get() as ProfileRow | undefined
  return row ? rowToProfile(row) : null
}

export function upsertProfile(payload: AgentProfilePayload): AgentProfile {
  const db = getDatabase()
  const existing = getProfile()

  if (existing) {
    db.prepare(`
      UPDATE agent_profile
      SET name = ?, role = ?, tone = ?, knowledge = ?, boundaries = ?, language = ?, respond_mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      payload.name,
      payload.role ?? null,
      payload.tone ?? null,
      payload.knowledge ?? null,
      payload.boundaries ?? null,
      payload.language ?? 'en',
      payload.respondMode ?? 'mentioned',
      existing.id
    )
  } else {
    db.prepare(`
      INSERT INTO agent_profile (name, role, tone, knowledge, boundaries, language, respond_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.name,
      payload.role ?? null,
      payload.tone ?? null,
      payload.knowledge ?? null,
      payload.boundaries ?? null,
      payload.language ?? 'en',
      payload.respondMode ?? 'mentioned'
    )
  }

  return getProfile()!
}

// ---------------------------------------------------------------------------
// Pattern CRUD
// ---------------------------------------------------------------------------

export function getPatterns(): readonly AgentPattern[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM agent_patterns ORDER BY created_at DESC').all() as PatternRow[]
  return rows.map(rowToPattern)
}

export function savePattern(payload: AgentPatternPayload): AgentPattern {
  const db = getDatabase()
  const info = db.prepare(`
    INSERT INTO agent_patterns (trigger_type, trigger_value, response_template, platform, enabled)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    payload.triggerType,
    payload.triggerValue,
    payload.responseTemplate,
    payload.platform ?? null,
    payload.enabled !== false ? 1 : 0
  )
  const row = db.prepare('SELECT * FROM agent_patterns WHERE id = ?').get(info.lastInsertRowid) as PatternRow
  return rowToPattern(row)
}

export function deletePattern(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM agent_patterns WHERE id = ?').run(id)
}

export function incrementPatternUsage(id: number): void {
  const db = getDatabase()
  db.prepare('UPDATE agent_patterns SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Automation CRUD
// ---------------------------------------------------------------------------

export function getAutomations(): readonly AgentAutomation[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM agent_automations ORDER BY created_at DESC').all() as AutomationRow[]
  return rows.map(rowToAutomation)
}

export function saveAutomation(payload: AgentAutomationPayload): AgentAutomation {
  const db = getDatabase()
  const info = db.prepare(`
    INSERT INTO agent_automations (name, trigger, action, platform, enabled)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    payload.name,
    JSON.stringify(payload.trigger),
    JSON.stringify(payload.action),
    payload.platform ?? null,
    payload.enabled !== false ? 1 : 0
  )
  const row = db.prepare('SELECT * FROM agent_automations WHERE id = ?').get(info.lastInsertRowid) as AutomationRow
  return rowToAutomation(row)
}

export function deleteAutomation(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM agent_automations WHERE id = ?').run(id)
}

export function toggleAutomation(id: number, enabled: boolean): void {
  const db = getDatabase()
  db.prepare('UPDATE agent_automations SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id)
}

export function markAutomationTriggered(id: number): void {
  const db = getDatabase()
  db.prepare('UPDATE agent_automations SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Action CRUD
// ---------------------------------------------------------------------------

export function getActions(filter: AgentActionsFilter): readonly AgentAction[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.actionType) {
    conditions.push('action_type = ?')
    params.push(filter.actionType)
  }
  if (filter.platform) {
    conditions.push('platform = ?')
    params.push(filter.platform)
  }
  if (filter.status) {
    conditions.push('status = ?')
    params.push(filter.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0

  const rows = db.prepare(
    `SELECT * FROM agent_actions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as ActionRow[]

  return rows.map(rowToAction)
}

export function createAction(action: {
  actionType: AgentActionType
  platform: Platform
  context?: string
  input?: string
  output?: string
  status?: AgentActionStatus
}): AgentAction {
  const db = getDatabase()
  const info = db.prepare(`
    INSERT INTO agent_actions (action_type, platform, context, input, output, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    action.actionType,
    action.platform,
    action.context ?? null,
    action.input ?? null,
    action.output ?? null,
    action.status ?? 'completed'
  )
  const row = db.prepare('SELECT * FROM agent_actions WHERE id = ?').get(info.lastInsertRowid) as ActionRow
  return rowToAction(row)
}

export function updateActionStatus(id: number, status: AgentActionStatus, correction?: string): void {
  const db = getDatabase()
  if (correction !== undefined) {
    db.prepare('UPDATE agent_actions SET status = ?, correction = ? WHERE id = ?').run(status, correction, id)
  } else {
    db.prepare('UPDATE agent_actions SET status = ? WHERE id = ?').run(status, id)
  }
}

export function updateActionOutput(id: number, output: string): void {
  const db = getDatabase()
  db.prepare('UPDATE agent_actions SET output = ? WHERE id = ?').run(output, id)
}

export function countTodayActions(): number {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM agent_actions WHERE date(created_at) = date('now')"
  ).get() as { count: number }
  return row.count
}

export function countPendingActions(): number {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM agent_actions WHERE status = 'pending'"
  ).get() as { count: number }
  return row.count
}
