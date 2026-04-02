import type { Platform } from './settings-types'

export type ReportPeriod = '7d' | '14d' | '30d' | '90d' | 'custom'

export type MetricCategory =
  | 'growth'
  | 'engagement'
  | 'retention'
  | 'moderation'
  | 'events'

export type ReportPlatformFilter = Platform | 'all'

export interface ReportConfig {
  readonly period: ReportPeriod
  readonly platformFilter: ReportPlatformFilter
  readonly metrics: readonly MetricCategory[]
  readonly customRange?: {
    readonly start: string // ISO date
    readonly end: string   // ISO date
  }
}

export interface GrowthMetrics {
  readonly currentMembers: number
  readonly previousMembers: number
  readonly growthRate: number       // percentage
  readonly growthData: readonly GrowthDataPoint[]
}

export interface GrowthDataPoint {
  readonly date: string
  readonly discord: number
  readonly telegram: number
}

export interface EngagementMetrics {
  readonly activeUsers: number
  readonly totalUsers: number
  readonly engagementRate: number   // percentage
  readonly messagesPerUser: number
  readonly discordEngagement: number
  readonly telegramEngagement: number
}

export interface RetentionMetrics {
  readonly startUsers: number
  readonly endUsers: number
  readonly newUsers: number
  readonly retentionRate: number    // percentage
  readonly churnRate: number        // percentage
}

export interface ModerationMetrics {
  readonly totalWarnings: number
  readonly totalBans: number
  readonly resolved: number
  readonly pending: number
}

export interface EventMetrics {
  readonly eventsHeld: number
  readonly totalRSVPs: number
  readonly attendanceRate: number   // percentage
}

export interface ReportData {
  readonly config: ReportConfig
  readonly periodStart: string
  readonly periodEnd: string
  readonly growth?: GrowthMetrics
  readonly engagement?: EngagementMetrics
  readonly retention?: RetentionMetrics
  readonly moderation?: ModerationMetrics
  readonly events?: EventMetrics
  readonly aiNarrative?: string
}

export interface SavedReport {
  readonly id: number
  readonly title: string
  readonly periodStart: string
  readonly periodEnd: string
  readonly data: ReportData
  readonly createdAt: string
}

export interface ReportExportResult {
  readonly filePath: string
}
