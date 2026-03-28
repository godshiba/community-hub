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

/**
 * For snapshot metrics (member_count, online_count): returns the sum of the
 * latest value per platform within the range. Avoids double-counting when
 * multiple syncs have written rows in the same period.
 */
function latestSnapshotSum(
  metric: string,
  rangeStart: string,
  rangeEnd: string
): number {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT ps.platform, ps.metric_value
    FROM platform_stats ps
    INNER JOIN (
      SELECT platform, MAX(timestamp) as max_ts
      FROM platform_stats
      WHERE metric_name = ? AND timestamp BETWEEN ? AND ?
      GROUP BY platform
    ) latest ON ps.platform = latest.platform
             AND ps.timestamp = latest.max_ts
             AND ps.metric_name = ?
    WHERE ps.metric_name = ?
  `).all(metric, rangeStart, rangeEnd, metric, metric) as Array<{ platform: string; metric_value: number }>
  return rows.reduce((sum, r) => sum + r.metric_value, 0)
}

/**
 * For cumulative metrics (message_count): MAX per platform prevents
 * over-counting when the same daily total is written multiple times.
 */
function maxMetricSum(
  metric: string,
  rangeStart: string,
  rangeEnd: string
): number {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT platform, MAX(metric_value) as value
    FROM platform_stats
    WHERE metric_name = ? AND timestamp BETWEEN ? AND ?
    GROUP BY platform
  `).all(metric, rangeStart, rangeEnd) as Array<{ platform: string; value: number }>
  return rows.reduce((sum, r) => sum + r.value, 0)
}

export function getStats(req: StatsRequest): AnalyticsData {
  const stats = getDashboardStats(req)
  const growth = getGrowthData(req)
  const heatmap = getHeatmapData(req)
  const comparison = getPlatformComparison(req)
  const contributors = getTopContributors()
  return { stats, growth, heatmap, comparison, contributors }
}

export function getDashboardStats(req: StatsRequest): DashboardStats {
  const { start, end } = resolveRange(req)
  const duration = new Date(end).getTime() - new Date(start).getTime()
  const prevStart = new Date(new Date(start).getTime() - duration).toISOString()

  const currentMembers = latestSnapshotSum('member_count', start, end)
  const prevMembers = latestSnapshotSum('member_count', prevStart, start)
  const currentOnline = latestSnapshotSum('online_count', start, end)
  const prevOnline = latestSnapshotSum('online_count', prevStart, start)
  const currentMessages = maxMetricSum('message_count', start, end)
  const prevMessages = maxMetricSum('message_count', prevStart, start)

  const engagement = currentMembers > 0 ? (currentMessages / currentMembers) * 100 : 0
  const prevEngagement = prevMembers > 0 ? (prevMessages / prevMembers) * 100 : 0

  const growthRateValue =
    prevMembers > 0
      ? Math.round(((currentMembers - prevMembers) / prevMembers) * 1000) / 10
      : 0

  return {
    totalMembers: buildStatsCard('Total Members', currentMembers, prevMembers),
    growthRate: {
      label: 'Growth Rate',
      value: growthRateValue,
      previousValue: 0,
      trend: growthRateValue,
      unit: '%'
    },
    activeUsers: buildStatsCard('Active Users', currentOnline, prevOnline),
    engagementRate: buildStatsCard(
      'Engagement Rate',
      Math.round(engagement * 10) / 10,
      Math.round(prevEngagement * 10) / 10,
      '%'
    )
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

  // Use latest snapshot per platform for member/online, max for messages
  const snapshotRows = db.prepare(`
    SELECT ps.platform, ps.metric_name, ps.metric_value as value
    FROM platform_stats ps
    INNER JOIN (
      SELECT platform, metric_name, MAX(timestamp) as max_ts
      FROM platform_stats
      WHERE metric_name IN ('member_count', 'online_count')
        AND timestamp BETWEEN ? AND ?
      GROUP BY platform, metric_name
    ) latest ON ps.platform = latest.platform
             AND ps.metric_name = latest.metric_name
             AND ps.timestamp = latest.max_ts
    WHERE ps.metric_name IN ('member_count', 'online_count')
  `).all(start, end) as Array<{ platform: string; metric_name: string; value: number }>

  const msgRows = db.prepare(`
    SELECT platform, MAX(metric_value) as value
    FROM platform_stats
    WHERE metric_name = 'message_count' AND timestamp BETWEEN ? AND ?
    GROUP BY platform
  `).all(start, end) as Array<{ platform: string; value: number }>

  const labels: Record<string, string> = {
    member_count: 'Members',
    online_count: 'Online',
    message_count: 'Messages'
  }

  const find = (rows: Array<{ platform: string; metric_name?: string; value: number }>, platform: string, metric?: string) =>
    rows.find((r) => r.platform === platform && (!metric || r.metric_name === metric))?.value ?? 0

  return [
    { metric: labels.member_count, discord: find(snapshotRows, 'discord', 'member_count'), telegram: find(snapshotRows, 'telegram', 'member_count') },
    { metric: labels.online_count, discord: find(snapshotRows, 'discord', 'online_count'), telegram: find(snapshotRows, 'telegram', 'online_count') },
    { metric: labels.message_count, discord: find(msgRows, 'discord'), telegram: find(msgRows, 'telegram') }
  ]
}

export function getTopContributors(): readonly Contributor[] {
  // Contributor tracking requires message-level data from Phase 5
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

// Keep for backwards compat — unused but exported to avoid breaking imports
export { StatsRow }
