import { getDatabase } from './database.service'
import type {
  AnalyticsData,
  StatsRequest,
  DashboardStats,
  StatsCard,
  GrowthPoint,
  HeatmapCell,
  PlatformMetric,
  Contributor
} from '@shared/analytics-types'

interface StatsRow {
  platform: string
  metric_name: string
  metric_value: number
  timestamp: string
}

function resolveRange(req: StatsRequest): { start: string; end: string } {
  if (req.period === 'custom' && req.range) {
    return { start: req.range.start, end: req.range.end }
  }
  const now = new Date()
  const end = now.toISOString()
  const ms = { day: 86400000, week: 604800000, month: 2592000000 }
  const offset = ms[req.period as keyof typeof ms] ?? ms.week
  const start = new Date(now.getTime() - offset).toISOString()
  return { start, end }
}

function buildStatsCard(
  label: string,
  current: number,
  previous: number,
  unit?: string
): StatsCard {
  const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0
  return { label, value: current, previousValue: previous, trend: Math.round(trend * 10) / 10, unit }
}

function sumMetric(rows: readonly StatsRow[], metric: string): number {
  return rows
    .filter((r) => r.metric_name === metric)
    .reduce((sum, r) => sum + r.metric_value, 0)
}

export function getStats(req: StatsRequest): AnalyticsData {
  const stats = getDashboardStats(req)
  const growth = getGrowthData(req)
  const heatmap = getHeatmapData(req)
  const comparison = getPlatformComparison(req)
  const contributors = getTopContributors(req)
  return { stats, growth, heatmap, comparison, contributors }
}

export function getDashboardStats(req: StatsRequest): DashboardStats {
  const db = getDatabase()
  const { start, end } = resolveRange(req)

  // Current period stats
  const current = db.prepare(`
    SELECT platform, metric_name, metric_value, timestamp
    FROM platform_stats
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
  `).all(start, end) as StatsRow[]

  // Previous period (same duration, shifted back)
  const duration = new Date(end).getTime() - new Date(start).getTime()
  const prevStart = new Date(new Date(start).getTime() - duration).toISOString()
  const previous = db.prepare(`
    SELECT platform, metric_name, metric_value, timestamp
    FROM platform_stats
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
  `).all(prevStart, start) as StatsRow[]

  const currentMembers = sumMetric(current, 'member_count')
  const prevMembers = sumMetric(previous, 'member_count')
  const currentOnline = sumMetric(current, 'online_count')
  const prevOnline = sumMetric(previous, 'online_count')
  const currentMessages = sumMetric(current, 'message_count')
  const prevMessages = sumMetric(previous, 'message_count')

  const engagement = currentMembers > 0 ? (currentMessages / currentMembers) * 100 : 0
  const prevEngagement = prevMembers > 0 ? (prevMessages / prevMembers) * 100 : 0

  return {
    totalMembers: buildStatsCard('Total Members', currentMembers, prevMembers),
    growthRate: buildStatsCard('Growth Rate', currentMembers - prevMembers, 0, '%'),
    activeUsers: buildStatsCard('Active Users', currentOnline, prevOnline),
    engagementRate: buildStatsCard('Engagement Rate', Math.round(engagement * 10) / 10, Math.round(prevEngagement * 10) / 10, '%')
  }
}

export function getGrowthData(req: StatsRequest): readonly GrowthPoint[] {
  const db = getDatabase()
  const { start, end } = resolveRange(req)

  const rows = db.prepare(`
    SELECT date(timestamp) as date, platform, MAX(metric_value) as value
    FROM platform_stats
    WHERE metric_name = 'member_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY date(timestamp), platform
    ORDER BY date(timestamp)
  `).all(start, end) as Array<{ date: string; platform: string; value: number }>

  const dateMap = new Map<string, { discord: number; telegram: number }>()
  for (const row of rows) {
    const entry = dateMap.get(row.date) ?? { discord: 0, telegram: 0 }
    if (row.platform === 'discord') entry.discord = row.value
    if (row.platform === 'telegram') entry.telegram = row.value
    dateMap.set(row.date, entry)
  }

  return Array.from(dateMap.entries()).map(([date, vals]) => ({
    date,
    discord: vals.discord,
    telegram: vals.telegram
  }))
}

export function getHeatmapData(req: StatsRequest): readonly HeatmapCell[] {
  const db = getDatabase()
  const { start, end } = resolveRange(req)

  const rows = db.prepare(`
    SELECT
      CAST(strftime('%w', timestamp) AS INTEGER) as day,
      CAST(strftime('%H', timestamp) AS INTEGER) as hour,
      SUM(metric_value) as value
    FROM platform_stats
    WHERE metric_name = 'message_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY day, hour
  `).all(start, end) as Array<{ day: number; hour: number; value: number }>

  return rows.map((r) => ({ day: r.day, hour: r.hour, value: r.value }))
}

export function getPlatformComparison(req: StatsRequest): readonly PlatformMetric[] {
  const db = getDatabase()
  const { start, end } = resolveRange(req)

  const rows = db.prepare(`
    SELECT platform, metric_name, MAX(metric_value) as value
    FROM platform_stats
    WHERE timestamp BETWEEN ? AND ?
    GROUP BY platform, metric_name
  `).all(start, end) as Array<{ platform: string; metric_name: string; value: number }>

  const metrics = ['member_count', 'online_count', 'message_count']
  const labels: Record<string, string> = {
    member_count: 'Members',
    online_count: 'Online',
    message_count: 'Messages'
  }

  return metrics.map((m) => ({
    metric: labels[m] ?? m,
    discord: rows.find((r) => r.platform === 'discord' && r.metric_name === m)?.value ?? 0,
    telegram: rows.find((r) => r.platform === 'telegram' && r.metric_name === m)?.value ?? 0
  }))
}

export function getTopContributors(_req: StatsRequest): readonly Contributor[] {
  // Contributor tracking requires message-level data from Phase 5
  // Return empty for now — will be populated when moderation module tracks per-user activity
  return []
}

export function insertStats(
  platform: string,
  metrics: Record<string, number>
): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, datetime('now'))
  `)

  const tx = db.transaction(() => {
    for (const [name, value] of Object.entries(metrics)) {
      stmt.run(platform, name, value)
    }
  })
  tx()
}
