import { getDatabase } from '../database.service'
import type {
  SpamConfig,
  FloodConfig,
  RaidConfig,
  SpamRule,
  SpamRulePayload,
  SpamEvent,
  SpamEventsFilter,
  RaidEvent,
  RaidState
} from '@shared/spam-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface SpamRuleRow {
  id: number
  name: string
  enabled: number
  platform: string
  rule_type: string
  threshold: number
  window_seconds: number
  action: string
  mute_duration_minutes: number | null
  created_at: string
  updated_at: string
}

interface SpamEventRow {
  id: number
  platform: string
  user_id: string
  username: string
  channel_id: string
  rule_type: string
  rule_name: string
  action_taken: string
  message_content: string | null
  detected_at: string
}

interface RaidEventRow {
  id: number
  platform: string
  state: string
  join_count: number
  window_seconds: number
  actions_taken: string
  started_at: string
  resolved_at: string | null
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToRule(row: SpamRuleRow): SpamRule {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === 1,
    platform: row.platform as SpamRule['platform'],
    ruleType: row.rule_type as SpamRule['ruleType'],
    threshold: row.threshold,
    windowSeconds: row.window_seconds,
    action: row.action as SpamRule['action'],
    muteDurationMinutes: row.mute_duration_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToSpamEvent(row: SpamEventRow): SpamEvent {
  return {
    id: row.id,
    platform: row.platform as SpamEvent['platform'],
    userId: row.user_id,
    username: row.username,
    channelId: row.channel_id,
    ruleType: row.rule_type as SpamEvent['ruleType'],
    ruleName: row.rule_name,
    actionTaken: row.action_taken as SpamEvent['actionTaken'],
    messageContent: row.message_content,
    detectedAt: row.detected_at
  }
}

function rowToRaidEvent(row: RaidEventRow): RaidEvent {
  return {
    id: row.id,
    platform: row.platform as RaidEvent['platform'],
    state: row.state as RaidState,
    joinCount: row.join_count,
    windowSeconds: row.window_seconds,
    actionsTaken: row.actions_taken,
    startedAt: row.started_at,
    resolvedAt: row.resolved_at
  }
}

// ---------------------------------------------------------------------------
// Config CRUD
// ---------------------------------------------------------------------------

export function getSpamConfig(): SpamConfig {
  const db = getDatabase()
  const floodRow = db.prepare("SELECT value FROM spam_config WHERE key = 'flood'").get() as { value: string } | undefined
  const raidRow = db.prepare("SELECT value FROM spam_config WHERE key = 'raid'").get() as { value: string } | undefined

  return {
    flood: floodRow ? JSON.parse(floodRow.value) as FloodConfig : {
      enabled: true, messageRateLimit: 5, messageRateWindowSeconds: 10,
      duplicateSimilarityThreshold: 80, maxLinksPerMessage: 3, maxMentionsPerMessage: 5,
      maxEmojiPerMessage: 15, maxCapsPercent: 70, defaultAction: 'mute', defaultMuteDurationMinutes: 10
    },
    raid: raidRow ? JSON.parse(raidRow.value) as RaidConfig : {
      enabled: true, joinThreshold: 10, joinWindowSeconds: 30, minAccountAgeDays: 7,
      autoSlowmode: true, autoLockdown: false, autoBanNewAccounts: false, notifyOwner: true
    }
  }
}

export function updateSpamConfig(config: SpamConfig): void {
  const db = getDatabase()
  db.prepare("INSERT OR REPLACE INTO spam_config (key, value) VALUES ('flood', ?)").run(JSON.stringify(config.flood))
  db.prepare("INSERT OR REPLACE INTO spam_config (key, value) VALUES ('raid', ?)").run(JSON.stringify(config.raid))
}

// ---------------------------------------------------------------------------
// Rules CRUD
// ---------------------------------------------------------------------------

export function getRules(): readonly SpamRule[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM spam_rules ORDER BY created_at DESC').all() as SpamRuleRow[]
  return rows.map(rowToRule)
}

export function saveRule(payload: SpamRulePayload & { id?: number }): SpamRule {
  const db = getDatabase()

  if (payload.id) {
    db.prepare(`
      UPDATE spam_rules SET name = ?, enabled = ?, platform = ?, rule_type = ?,
        threshold = ?, window_seconds = ?, action = ?, mute_duration_minutes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      payload.name, payload.enabled ? 1 : 0, payload.platform, payload.ruleType,
      payload.threshold, payload.windowSeconds, payload.action,
      payload.muteDurationMinutes, payload.id
    )
    const row = db.prepare('SELECT * FROM spam_rules WHERE id = ?').get(payload.id) as SpamRuleRow
    return rowToRule(row)
  }

  const result = db.prepare(`
    INSERT INTO spam_rules (name, enabled, platform, rule_type, threshold, window_seconds, action, mute_duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payload.name, payload.enabled ? 1 : 0, payload.platform, payload.ruleType,
    payload.threshold, payload.windowSeconds, payload.action,
    payload.muteDurationMinutes
  )
  const row = db.prepare('SELECT * FROM spam_rules WHERE id = ?').get(Number(result.lastInsertRowid)) as SpamRuleRow
  return rowToRule(row)
}

export function deleteRule(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM spam_rules WHERE id = ?').run(id)
}

export function toggleRule(id: number, enabled: boolean): void {
  const db = getDatabase()
  db.prepare("UPDATE spam_rules SET enabled = ?, updated_at = datetime('now') WHERE id = ?").run(enabled ? 1 : 0, id)
}

// ---------------------------------------------------------------------------
// Spam events
// ---------------------------------------------------------------------------

export function logSpamEvent(event: Omit<SpamEvent, 'id' | 'detectedAt'>): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO spam_events (platform, user_id, username, channel_id, rule_type, rule_name, action_taken, message_content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.platform, event.userId, event.username, event.channelId,
    event.ruleType, event.ruleName, event.actionTaken, event.messageContent
  )
}

export function getSpamEvents(filter: SpamEventsFilter): readonly SpamEvent[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.platform) {
    conditions.push('platform = ?')
    params.push(filter.platform)
  }
  if (filter.ruleType) {
    conditions.push('rule_type = ?')
    params.push(filter.ruleType)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = filter.limit ?? 100
  const offset = filter.offset ?? 0

  const rows = db.prepare(
    `SELECT * FROM spam_events ${where} ORDER BY detected_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as SpamEventRow[]

  return rows.map(rowToSpamEvent)
}

// ---------------------------------------------------------------------------
// Raid events
// ---------------------------------------------------------------------------

export function logRaidEvent(platform: string, state: RaidState, joinCount: number, windowSeconds: number, actionsTaken: string): RaidEvent {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO raid_events (platform, state, join_count, window_seconds, actions_taken)
    VALUES (?, ?, ?, ?, ?)
  `).run(platform, state, joinCount, windowSeconds, actionsTaken)

  const row = db.prepare('SELECT * FROM raid_events WHERE id = ?').get(Number(result.lastInsertRowid)) as RaidEventRow
  return rowToRaidEvent(row)
}

export function resolveRaidEvent(id: number): void {
  const db = getDatabase()
  db.prepare("UPDATE raid_events SET state = 'normal', resolved_at = datetime('now') WHERE id = ?").run(id)
}

export function getRaidEvents(limit: number = 50): readonly RaidEvent[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM raid_events ORDER BY started_at DESC LIMIT ?').all(limit) as RaidEventRow[]
  return rows.map(rowToRaidEvent)
}

export function getLatestActiveRaid(): RaidEvent | null {
  const db = getDatabase()
  const row = db.prepare(
    "SELECT * FROM raid_events WHERE state IN ('suspected', 'active') ORDER BY started_at DESC LIMIT 1"
  ).get() as RaidEventRow | undefined
  return row ? rowToRaidEvent(row) : null
}
