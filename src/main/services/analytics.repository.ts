import { getDatabase } from './database.service'
import type {
  AnalyticsData,
  StatsRequest,
  DashboardStats,
  StatsCard,
  GrowthPoint,
  HeatmapCell,
  Contributor
} from '@shared/analytics-types'

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
  sparkline: readonly number[],
  unit?: string
): StatsCard {
  const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0
  return {
    label,
    value: current,
    previousValue: previous,
    trend: Math.round(trend * 10) / 10,
    unit,
    sparkline
  }
}

const SPARKLINE_LIMIT = 14

/**
 * Daily series of `metric` for `platform`, oldest → newest, length ≤ SPARKLINE_LIMIT.
 * Latest snapshot per day for snapshot-style metrics, MAX for cumulative ones.
 */
function dailySeries(
  platform: string,
  metric: string,
  rangeStart: string,
  rangeEnd: string
): readonly number[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT date(timestamp) as date, MAX(metric_value) as value
    FROM platform_stats
    WHERE platform = ? AND metric_name = ?
      AND timestamp BETWEEN ? AND ?
    GROUP BY date(timestamp)
    ORDER BY date(timestamp) DESC
    LIMIT ?
  `).all(platform, metric, rangeStart, rangeEnd, SPARKLINE_LIMIT) as Array<{
    date: string
    value: number
  }>
  // Re-order ascending (oldest → newest) for the sparkline path direction
  return rows.map((r) => r.value).reverse()
}

/**
 * Latest snapshot value for a metric for a single platform.
 * Uses the most recent row in the period — avoids double-counting
 * when multiple syncs wrote rows in the same window.
 */
function latestSnapshot(
  platform: string,
  metric: string,
  rangeStart: string,
  rangeEnd: string
): number {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT metric_value
    FROM platform_stats
    WHERE platform = ? AND metric_name = ? AND timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
    LIMIT 1
  `).get(platform, metric, rangeStart, rangeEnd) as { metric_value: number } | undefined
  return row?.metric_value ?? 0
}

/**
 * Max metric value for a platform in a range.
 * Suitable for "messages today" which is a running total per sync.
 */
function maxMetric(
  platform: string,
  metric: string,
  rangeStart: string,
  rangeEnd: string
): number {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT MAX(metric_value) as value
    FROM platform_stats
    WHERE platform = ? AND metric_name = ? AND timestamp BETWEEN ? AND ?
  `).get(platform, metric, rangeStart, rangeEnd) as { value: number } | undefined
  return row?.value ?? 0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getStats(req: StatsRequest): AnalyticsData {
  const stats = getDashboardStats(req)
  const growth = getGrowthData(req)
  const heatmap = getHeatmapData(req)
  const contributors = getTopContributors()
  return { stats, growth, heatmap, contributors }
}

export function getDashboardStats(req: StatsRequest): DashboardStats {
  const { start, end } = resolveRange(req)
  const p = req.platform
  const duration = new Date(end).getTime() - new Date(start).getTime()
  const prevStart = new Date(new Date(start).getTime() - duration).toISOString()

  const currentMembers = latestSnapshot(p, 'member_count', start, end)
  const prevMembers = latestSnapshot(p, 'member_count', prevStart, start)
  const currentOnline = latestSnapshot(p, 'online_count', start, end)
  const prevOnline = latestSnapshot(p, 'online_count', prevStart, start)
  const currentMessages = maxMetric(p, 'message_count', start, end)
  const prevMessages = maxMetric(p, 'message_count', prevStart, start)

  const engagement = currentMembers > 0 ? (currentMessages / currentMembers) * 100 : 0
  const prevEngagement = prevMembers > 0 ? (prevMessages / prevMembers) * 100 : 0

  const growthRateValue =
    prevMembers > 0
      ? Math.round(((currentMembers - prevMembers) / prevMembers) * 1000) / 10
      : 0

  // Sparkline range: span both current and previous periods so the line has
  // history to draw against — capped to SPARKLINE_LIMIT days by the helper.
  const memberSeries = dailySeries(p, 'member_count', prevStart, end)
  const onlineSeries = dailySeries(p, 'online_count', prevStart, end)
  const messageSeries = dailySeries(p, 'message_count', prevStart, end)
  // Growth-rate sparkline derived from the member series day-over-day delta %.
  const growthRateSeries = memberSeries.map((value, idx) => {
    if (idx === 0) return 0
    const prev = memberSeries[idx - 1] ?? 0
    return prev > 0 ? Math.round(((value - prev) / prev) * 1000) / 10 : 0
  })
  // Engagement-rate sparkline = messages / members per day (best-effort).
  const engagementSeries = messageSeries.map((m, i) => {
    const members = memberSeries[i] ?? 0
    return members > 0 ? Math.round((m / members) * 1000) / 10 : 0
  })

  return {
    totalMembers: buildStatsCard('Total Members', currentMembers, prevMembers, memberSeries),
    growthRate: {
      label: 'Growth Rate',
      value: growthRateValue,
      previousValue: 0,
      trend: growthRateValue,
      unit: '%',
      sparkline: growthRateSeries
    },
    activeUsers: buildStatsCard('Active Users', currentOnline, prevOnline, onlineSeries),
    engagementRate: buildStatsCard(
      'Engagement Rate',
      Math.round(engagement * 10) / 10,
      Math.round(prevEngagement * 10) / 10,
      engagementSeries,
      '%'
    )
  }
}

export function getGrowthData(req: StatsRequest): readonly GrowthPoint[] {
  const db = getDatabase()
  const { start, end } = resolveRange(req)

  const rows = db.prepare(`
    SELECT date(timestamp) as date, MAX(metric_value) as value
    FROM platform_stats
    WHERE platform = ? AND metric_name = 'member_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY date(timestamp)
    ORDER BY date(timestamp)
  `).all(req.platform, start, end) as Array<{ date: string; value: number }>

  return rows.map((r) => ({ date: r.date, value: r.value }))
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
    WHERE platform = ? AND metric_name = 'message_count'
      AND timestamp BETWEEN ? AND ?
    GROUP BY day, hour
  `).all(req.platform, start, end) as Array<{ day: number; hour: number; value: number }>

  return rows.map((r) => ({ day: r.day, hour: r.hour, value: r.value }))
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
