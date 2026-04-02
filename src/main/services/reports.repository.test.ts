import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

import {
  generateReport,
  saveReport,
  listReports,
  getReport,
  deleteReport
} from './reports.repository'

function seedData(): void {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 604800000)

  // Stats data
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

  // Members
  db.prepare(`
    INSERT INTO community_members (username, platform, platform_user_id, join_date, status)
    VALUES (?, ?, ?, ?, ?)
  `).run('Alice', 'discord', 'u1', weekAgo.toISOString(), 'active')

  // Warnings
  db.prepare(`
    INSERT INTO member_warnings (member_id, reason) VALUES (?, ?)
  `).run(1, 'Spam')

  // Events
  db.prepare(`
    INSERT INTO events (title, event_date, status) VALUES (?, ?, ?)
  `).run('Meetup', now.toISOString(), 'upcoming')
}

describe('reports.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('generateReport', () => {
    it('generates report with all metrics', () => {
      seedData()

      const data = generateReport({
        metrics: ['growth', 'engagement', 'retention', 'moderation', 'events'],
        period: '7d',
        platformFilter: 'all'
      })

      expect(data.config.metrics).toContain('growth')
      expect(data.periodStart).toBeDefined()
      expect(data.periodEnd).toBeDefined()
      expect(data.growth).toBeDefined()
      expect(data.engagement).toBeDefined()
      expect(data.retention).toBeDefined()
      expect(data.moderation).toBeDefined()
      expect(data.events).toBeDefined()
    })

    it('generates report with selected metrics only', () => {
      seedData()

      const data = generateReport({
        metrics: ['growth'],
        period: '7d',
        platformFilter: 'all'
      })

      expect(data.growth).toBeDefined()
      expect(data.engagement).toBeUndefined()
    })

    it('supports custom date range', () => {
      seedData()
      const now = new Date()

      const data = generateReport({
        metrics: ['growth'],
        period: 'custom',
        platformFilter: 'all',
        customRange: {
          start: new Date(now.getTime() - 86400000).toISOString(),
          end: now.toISOString()
        }
      })

      expect(data.growth).toBeDefined()
    })

    it('filters by platform', () => {
      seedData()

      const data = generateReport({
        metrics: ['engagement'],
        period: '7d',
        platformFilter: 'discord'
      })

      expect(data.engagement).toBeDefined()
    })
  })

  describe('saveReport / getReport / listReports / deleteReport', () => {
    it('saves and retrieves a report', () => {
      seedData()
      const data = generateReport({
        metrics: ['growth'],
        period: '7d',
        platformFilter: 'all'
      })

      const saved = saveReport('Weekly Growth', data)
      expect(saved.id).toBeGreaterThan(0)
      expect(saved.title).toBe('Weekly Growth')

      const retrieved = getReport(saved.id as number)
      expect(retrieved.title).toBe('Weekly Growth')
      expect(retrieved.data.growth).toBeDefined()
    })

    it('lists all reports', () => {
      seedData()
      const data = generateReport({ metrics: ['growth'], period: '7d', platformFilter: 'all' })
      saveReport('Report 1', data)
      saveReport('Report 2', data)

      const reports = listReports()
      expect(reports.length).toBe(2)
    })

    it('deletes a report', () => {
      seedData()
      const data = generateReport({ metrics: ['growth'], period: '7d', platformFilter: 'all' })
      const saved = saveReport('To Delete', data)

      deleteReport(saved.id as number)
      expect(() => getReport(saved.id as number)).toThrow()
    })

    it('throws when deleting non-existent report', () => {
      expect(() => deleteReport(999)).toThrow('Report 999 not found')
    })

    it('throws when getting non-existent report', () => {
      expect(() => getReport(999)).toThrow('Report 999 not found')
    })
  })

  describe('metrics computations', () => {
    it('computes growth metrics with rate', () => {
      const now = new Date()
      const twoWeeksAgo = new Date(now.getTime() - 1209600000)

      db.prepare(`
        INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
        VALUES (?, ?, ?, ?)
      `).run('discord', 'member_count', 80, twoWeeksAgo.toISOString())

      db.prepare(`
        INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp)
        VALUES (?, ?, ?, ?)
      `).run('discord', 'member_count', 100, now.toISOString())

      const data = generateReport({
        metrics: ['growth'],
        period: '7d',
        platformFilter: 'all'
      })

      expect(data.growth!.currentMembers).toBe(100)
      expect(data.growth!.previousMembers).toBe(80)
      expect(data.growth!.growthRate).toBe(25)
    })

    it('computes moderation metrics', () => {
      seedData()

      const data = generateReport({
        metrics: ['moderation'],
        period: '7d',
        platformFilter: 'all'
      })

      expect(data.moderation!.totalWarnings).toBeGreaterThanOrEqual(0)
    })

    it('computes event metrics', () => {
      seedData()

      const data = generateReport({
        metrics: ['events'],
        period: '30d',
        platformFilter: 'all'
      })

      expect(data.events).toBeDefined()
      expect(data.events!.eventsHeld).toBeGreaterThanOrEqual(0)
    })
  })
})
