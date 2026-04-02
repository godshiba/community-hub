import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

import {
  getStats,
  getDashboardStats,
  getGrowthData,
  getHeatmapData,
  getTopContributors,
  insertStats
} from './analytics.repository'

function seedStats(): void {
  const now = new Date()
  // Use 3-hour offset within "day" period so both current and previous fall in range
  const threeHoursAgo = new Date(now.getTime() - 10800000)

  // Current period data (recent)
  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'member_count', 100, now.toISOString())

  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'online_count', 25, now.toISOString())

  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'message_count', 500, now.toISOString())

  // Previous period data — use week period: current = last 7 days, previous = 7-14 days ago
  const twoWeeksAgo = new Date(now.getTime() - 864000000) // 10 days ago
  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'member_count', 80, twoWeeksAgo.toISOString())

  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'online_count', 20, twoWeeksAgo.toISOString())

  db.prepare(`
    INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
    VALUES (?, ?, ?, ?)
  `).run('discord', 'message_count', 300, twoWeeksAgo.toISOString())
}

describe('analytics.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('insertStats', () => {
    it('inserts multiple metrics in a transaction', () => {
      insertStats('discord', {
        member_count: 100,
        online_count: 25,
        message_count: 500
      })

      const rows = db.prepare(
        "SELECT * FROM platform_stats WHERE platform = 'discord'"
      ).all()
      expect(rows.length).toBe(3)
    })
  })

  describe('getDashboardStats', () => {
    it('computes stats cards with trends', () => {
      seedStats()

      const stats = getDashboardStats({ period: 'week', platform: 'discord' })
      expect(stats.totalMembers.value).toBe(100)
      expect(stats.totalMembers.previousValue).toBe(80)
      expect(stats.totalMembers.trend).toBe(25)
      expect(stats.activeUsers.value).toBe(25)
    })

    it('returns zeros when no data exists', () => {
      const stats = getDashboardStats({ period: 'week', platform: 'discord' })
      expect(stats.totalMembers.value).toBe(0)
      expect(stats.totalMembers.previousValue).toBe(0)
      expect(stats.growthRate.value).toBe(0)
    })

    it('supports custom date range', () => {
      seedStats()
      const now = new Date()
      const stats = getDashboardStats({
        period: 'custom',
        platform: 'discord',
        range: {
          start: new Date(now.getTime() - 86400000).toISOString(),
          end: now.toISOString()
        }
      })
      expect(stats.totalMembers.value).toBe(100)
    })
  })

  describe('getGrowthData', () => {
    it('returns daily growth points', () => {
      seedStats()
      const growth = getGrowthData({ period: 'week', platform: 'discord' })
      expect(growth.length).toBeGreaterThan(0)
      expect(growth[0]).toHaveProperty('date')
      expect(growth[0]).toHaveProperty('value')
    })

    it('returns empty array with no data', () => {
      const growth = getGrowthData({ period: 'week', platform: 'discord' })
      expect(growth).toEqual([])
    })
  })

  describe('getHeatmapData', () => {
    it('returns heatmap cells with day and hour', () => {
      seedStats()
      const heatmap = getHeatmapData({ period: 'week', platform: 'discord' })
      // May or may not have data depending on timing
      for (const cell of heatmap) {
        expect(cell).toHaveProperty('day')
        expect(cell).toHaveProperty('hour')
        expect(cell).toHaveProperty('value')
      }
    })
  })

  describe('getTopContributors', () => {
    it('returns empty array (placeholder)', () => {
      expect(getTopContributors()).toEqual([])
    })
  })

  describe('getStats (combined)', () => {
    it('returns all analytics data', () => {
      seedStats()
      const data = getStats({ period: 'week', platform: 'discord' })
      expect(data).toHaveProperty('stats')
      expect(data).toHaveProperty('growth')
      expect(data).toHaveProperty('heatmap')
      expect(data).toHaveProperty('contributors')
    })
  })
})
