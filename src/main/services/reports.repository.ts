import { getDatabase } from './database.service'
import type {
  ReportConfig,
  ReportData,
  SavedReport,
  GrowthMetrics,
  GrowthDataPoint,
  EngagementMetrics,
  RetentionMetrics,
  ModerationMetrics,
  EventMetrics,
  ReportPlatformFilter
} from '@shared/reports-types'

// ---------------------------------------------------------------------------
// Period resolution
// ---------------------------------------------------------------------------

function resolvePeriod(config: ReportConfig): { start: string; end: string } {
  if (config.period === 'custom' && config.customRange) {
    return { start: config.customRange.start, end: config.customRange.end }
  }
  const now = new Date()
  const end = now.toISOString()
  const days = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 }
  const offset = (days[config.period as keyof typeof days] ?? 7) * 86400000
  const start = new Date(now.getTime() - offset).toISOString()
  return { start, end }
}

function previousPeriod(start: string, end: string): { prevStart: string; prevEnd: string } {
  const duration = new Date(end).getTime() - new Date(start).getTime()
  return {
    prevStart: new Date(new Date(start).getTime() - duration).toISOString(),
    prevEnd: start
  }
}

// ---------------------------------------------------------------------------
// Platform-aware helpers
// ---------------------------------------------------------------------------

type Row<T> = T | undefined

function platformClause(filter: ReportPlatformFilter): { clause: string; params: string[] } {
  if (filter === 'all') return { clause: '', params: [] }
  return { clause: 'AND platform = ?', params: [filter] }
}

// ---------------------------------------------------------------------------
// Growth metrics
// ---------------------------------------------------------------------------

function computeGrowth(
  config: ReportConfig,
  start: string,
  end: string
): GrowthMetrics {
  const db = getDatabase()
  const { prevStart, prevEnd } = previousPeriod(start, end)
  const { clause, params } = platformClause(config.platformFilter)

  const currentRow = db.prepare(`
    SELECT MAX(metric_value) as value FROM platform_stats
    WHERE metric_name = 'member_count' AND timestamp BETWEEN ? AND ? ${clause}
  `).get(start, end, ...params) as Row<{ value: number }>

  const prevRow = db.prepare(`
    SELECT MAX(metric_value) as value FROM platform_stats
    WHERE metric_name = 'member_count' AND timestamp BETWEEN ? AND ? ${clause}
  `).get(prevStart, prevEnd, ...params) as Row<{ value: number }>

  const current = currentRow?.value ?? 0
  const previous = prevRow?.value ?? 0
  const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0

  // Daily growth data by platform
  const discordRows = db.prepare(`
    SELECT date(timestamp) as date, MAX(metric_value) as value
    FROM platform_stats
    WHERE platform = 'discord' AND metric_name = 'member_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY date(timestamp) ORDER BY date(timestamp)
  `).all(start, end) as Array<{ date: string; value: number }>

  const telegramRows = db.prepare(`
    SELECT date(timestamp) as date, MAX(metric_value) as value
    FROM platform_stats
    WHERE platform = 'telegram' AND metric_name = 'member_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY date(timestamp) ORDER BY date(timestamp)
  `).all(start, end) as Array<{ date: string; value: number }>

  const dateMap = new Map<string, GrowthDataPoint>()
  for (const r of discordRows) {
    dateMap.set(r.date, { date: r.date, discord: r.value, telegram: 0 })
  }
  for (const r of telegramRows) {
    const existing = dateMap.get(r.date)
    if (existing) {
      dateMap.set(r.date, { ...existing, telegram: r.value })
    } else {
      dateMap.set(r.date, { date: r.date, discord: 0, telegram: r.value })
    }
  }

  const growthData = Array.from(dateMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  )

  return {
    currentMembers: current,
    previousMembers: previous,
    growthRate: Math.round(growthRate * 10) / 10,
    growthData
  }
}

// ---------------------------------------------------------------------------
// Engagement metrics
// ---------------------------------------------------------------------------

function computeEngagement(
  config: ReportConfig,
  start: string,
  end: string
): EngagementMetrics {
  const db = getDatabase()
  const { clause, params } = platformClause(config.platformFilter)

  const membersRow = db.prepare(`
    SELECT MAX(metric_value) as value FROM platform_stats
    WHERE metric_name = 'member_count' AND timestamp BETWEEN ? AND ? ${clause}
  `).get(start, end, ...params) as Row<{ value: number }>

  const onlineRow = db.prepare(`
    SELECT AVG(metric_value) as value FROM platform_stats
    WHERE metric_name = 'online_count' AND timestamp BETWEEN ? AND ? ${clause}
  `).get(start, end, ...params) as Row<{ value: number }>

  const messagesRow = db.prepare(`
    SELECT SUM(metric_value) as value FROM platform_stats
    WHERE metric_name = 'message_count' AND timestamp BETWEEN ? AND ? ${clause}
  `).get(start, end, ...params) as Row<{ value: number }>

  const totalUsers = membersRow?.value ?? 0
  const activeUsers = Math.round(onlineRow?.value ?? 0)
  const messages = messagesRow?.value ?? 0
  const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
  const messagesPerUser = totalUsers > 0 ? messages / totalUsers : 0

  // Per-platform engagement
  const discordMsg = db.prepare(`
    SELECT SUM(metric_value) as value FROM platform_stats
    WHERE platform = 'discord' AND metric_name = 'message_count'
      AND timestamp BETWEEN ? AND ?
  `).get(start, end) as Row<{ value: number }>

  const telegramMsg = db.prepare(`
    SELECT SUM(metric_value) as value FROM platform_stats
    WHERE platform = 'telegram' AND metric_name = 'message_count'
      AND timestamp BETWEEN ? AND ?
  `).get(start, end) as Row<{ value: number }>

  return {
    activeUsers,
    totalUsers,
    engagementRate: Math.round(engagementRate * 10) / 10,
    messagesPerUser: Math.round(messagesPerUser * 10) / 10,
    discordEngagement: discordMsg?.value ?? 0,
    telegramEngagement: telegramMsg?.value ?? 0
  }
}

// ---------------------------------------------------------------------------
// Retention metrics
// ---------------------------------------------------------------------------

function computeRetention(
  config: ReportConfig,
  start: string,
  end: string
): RetentionMetrics {
  const db = getDatabase()
  const { clause, params } = platformClause(config.platformFilter)

  // Members at start of period
  const startRow = db.prepare(`
    SELECT COUNT(*) as count FROM community_members
    WHERE join_date <= ? ${clause}
  `).get(start, ...params) as Row<{ count: number }>

  // Members at end of period
  const endRow = db.prepare(`
    SELECT COUNT(*) as count FROM community_members
    WHERE join_date <= ? ${clause}
  `).get(end, ...params) as Row<{ count: number }>

  // New members in period
  const newRow = db.prepare(`
    SELECT COUNT(*) as count FROM community_members
    WHERE join_date BETWEEN ? AND ? ${clause}
  `).get(start, end, ...params) as Row<{ count: number }>

  const startUsers = startRow?.count ?? 0
  const endUsers = endRow?.count ?? 0
  const newUsers = newRow?.count ?? 0

  const retentionRate = startUsers > 0
    ? ((endUsers - newUsers) / startUsers) * 100
    : 100
  const churnRate = 100 - retentionRate

  return {
    startUsers,
    endUsers,
    newUsers,
    retentionRate: Math.round(Math.max(0, Math.min(100, retentionRate)) * 10) / 10,
    churnRate: Math.round(Math.max(0, Math.min(100, churnRate)) * 10) / 10
  }
}

// ---------------------------------------------------------------------------
// Moderation metrics
// ---------------------------------------------------------------------------

function computeModeration(start: string, end: string): ModerationMetrics {
  const db = getDatabase()

  const warnings = db.prepare(`
    SELECT COUNT(*) as count FROM member_warnings
    WHERE given_at BETWEEN ? AND ?
  `).get(start, end) as Row<{ count: number }>

  const bans = db.prepare(`
    SELECT COUNT(*) as count FROM member_actions
    WHERE action_type = 'ban' AND executed_at BETWEEN ? AND ?
  `).get(start, end) as Row<{ count: number }>

  const resolved = db.prepare(`
    SELECT COUNT(*) as count FROM member_warnings
    WHERE resolved = TRUE AND resolved_at BETWEEN ? AND ?
  `).get(start, end) as Row<{ count: number }>

  const pending = db.prepare(`
    SELECT COUNT(*) as count FROM member_warnings
    WHERE resolved = FALSE AND given_at BETWEEN ? AND ?
  `).get(start, end) as Row<{ count: number }>

  return {
    totalWarnings: warnings?.count ?? 0,
    totalBans: bans?.count ?? 0,
    resolved: resolved?.count ?? 0,
    pending: pending?.count ?? 0
  }
}

// ---------------------------------------------------------------------------
// Event metrics
// ---------------------------------------------------------------------------

function computeEvents(start: string, end: string): EventMetrics {
  const db = getDatabase()

  const eventsRow = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE event_date BETWEEN ? AND ? AND status != 'cancelled'
  `).get(start, end) as Row<{ count: number }>

  const rsvpRow = db.prepare(`
    SELECT COUNT(*) as count FROM event_rsvps r
    JOIN events e ON r.event_id = e.id
    WHERE e.event_date BETWEEN ? AND ?
  `).get(start, end) as Row<{ count: number }>

  const attendedRow = db.prepare(`
    SELECT COUNT(*) as count FROM event_rsvps r
    JOIN events e ON r.event_id = e.id
    WHERE e.event_date BETWEEN ? AND ? AND r.response = 'yes'
  `).get(start, end) as Row<{ count: number }>

  const totalRSVPs = rsvpRow?.count ?? 0
  const attended = attendedRow?.count ?? 0
  const attendanceRate = totalRSVPs > 0 ? (attended / totalRSVPs) * 100 : 0

  return {
    eventsHeld: eventsRow?.count ?? 0,
    totalRSVPs,
    attendanceRate: Math.round(attendanceRate * 10) / 10
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateReport(config: ReportConfig): ReportData {
  const { start, end } = resolvePeriod(config)
  const metrics = new Set(config.metrics)

  const data: ReportData = {
    config,
    periodStart: start,
    periodEnd: end,
    ...(metrics.has('growth') ? { growth: computeGrowth(config, start, end) } : {}),
    ...(metrics.has('engagement') ? { engagement: computeEngagement(config, start, end) } : {}),
    ...(metrics.has('retention') ? { retention: computeRetention(config, start, end) } : {}),
    ...(metrics.has('moderation') ? { moderation: computeModeration(start, end) } : {}),
    ...(metrics.has('events') ? { events: computeEvents(start, end) } : {})
  }

  return data
}

export function saveReport(title: string, data: ReportData): SavedReport {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO generated_reports (title, period_start, period_end, metrics, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    title,
    data.periodStart,
    data.periodEnd,
    JSON.stringify(data.config.metrics),
    JSON.stringify(data)
  )

  return {
    id: result.lastInsertRowid as number,
    title,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    data,
    createdAt: new Date().toISOString()
  }
}

export function listReports(): readonly SavedReport[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT id, title, period_start, period_end, data, created_at
    FROM generated_reports
    ORDER BY created_at DESC
  `).all() as Array<{
    id: number
    title: string
    period_start: string
    period_end: string
    data: string
    created_at: string
  }>

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    data: JSON.parse(r.data) as ReportData,
    createdAt: r.created_at
  }))
}

export function getReport(id: number): SavedReport {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT id, title, period_start, period_end, data, created_at
    FROM generated_reports WHERE id = ?
  `).get(id) as {
    id: number
    title: string
    period_start: string
    period_end: string
    data: string
    created_at: string
  } | undefined

  if (!row) throw new Error(`Report ${id} not found`)

  return {
    id: row.id,
    title: row.title,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    data: JSON.parse(row.data) as ReportData,
    createdAt: row.created_at
  }
}

export function deleteReport(id: number): void {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM generated_reports WHERE id = ?').run(id)
  if (result.changes === 0) throw new Error(`Report ${id} not found`)
}
