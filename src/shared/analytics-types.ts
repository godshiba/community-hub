import type { Platform } from './settings-types'

export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'custom'

export interface PeriodRange {
  readonly start: string   // ISO date
  readonly end: string     // ISO date
}

export interface StatsCard {
  readonly label: string
  readonly value: number
  readonly previousValue: number
  readonly trend: number   // percentage change
  readonly unit?: string
}

export interface DashboardStats {
  readonly totalMembers: StatsCard
  readonly growthRate: StatsCard
  readonly activeUsers: StatsCard
  readonly engagementRate: StatsCard
}

export interface GrowthPoint {
  readonly date: string    // ISO date
  readonly discord: number
  readonly telegram: number
}

export interface HeatmapCell {
  readonly day: number     // 0=Sun, 6=Sat
  readonly hour: number    // 0-23
  readonly value: number
}

export interface PlatformMetric {
  readonly metric: string
  readonly discord: number
  readonly telegram: number
}

export interface Contributor {
  readonly id: string
  readonly name: string
  readonly avatar?: string
  readonly platform: Platform
  readonly messageCount: number
  readonly score: number
}

export interface AnalyticsData {
  readonly stats: DashboardStats
  readonly growth: readonly GrowthPoint[]
  readonly heatmap: readonly HeatmapCell[]
  readonly comparison: readonly PlatformMetric[]
  readonly contributors: readonly Contributor[]
}

export interface StatsRequest {
  readonly period: AnalyticsPeriod
  readonly range?: PeriodRange
}

export interface ExportRequest {
  readonly format: 'csv' | 'pdf'
  readonly period: AnalyticsPeriod
  readonly range?: PeriodRange
}

export interface ExportResult {
  readonly filePath: string
  readonly format: 'csv' | 'pdf'
}

export interface StatsSyncResult {
  readonly syncedAt: string
  readonly discord: { members: number; online: number }
  readonly telegram: { members: number }
}
