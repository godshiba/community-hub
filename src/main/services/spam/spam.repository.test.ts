import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../../test/db-helper'

let db: Database.Database

vi.mock('../database.service', () => ({
  getDatabase: () => db
}))

import {
  getSpamConfig,
  updateSpamConfig,
  getRules,
  saveRule,
  deleteRule,
  toggleRule,
  logSpamEvent,
  getSpamEvents,
  logRaidEvent,
  getRaidEvents,
  getLatestActiveRaid,
  resolveRaidEvent
} from './spam.repository'

describe('SpamRepository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  // -----------------------------------------------------------------------
  // Config
  // -----------------------------------------------------------------------

  describe('config', () => {
    it('returns default config from migration', () => {
      const config = getSpamConfig()
      expect(config.flood.enabled).toBe(true)
      expect(config.flood.messageRateLimit).toBe(5)
      expect(config.raid.enabled).toBe(true)
      expect(config.raid.joinThreshold).toBe(10)
    })

    it('persists config updates', () => {
      const config = getSpamConfig()
      updateSpamConfig({
        ...config,
        flood: { ...config.flood, messageRateLimit: 20 },
        raid: { ...config.raid, joinThreshold: 50 }
      })

      const updated = getSpamConfig()
      expect(updated.flood.messageRateLimit).toBe(20)
      expect(updated.raid.joinThreshold).toBe(50)
    })
  })

  // -----------------------------------------------------------------------
  // Rules CRUD
  // -----------------------------------------------------------------------

  describe('rules', () => {
    it('starts with no custom rules', () => {
      expect(getRules().length).toBe(0)
    })

    it('creates a rule', () => {
      const rule = saveRule({
        name: 'No links',
        enabled: true,
        platform: 'all',
        ruleType: 'link_spam',
        threshold: 1,
        windowSeconds: 10,
        action: 'delete',
        muteDurationMinutes: null
      })
      expect(rule.id).toBeGreaterThan(0)
      expect(rule.name).toBe('No links')
      expect(rule.enabled).toBe(true)
    })

    it('lists rules', () => {
      saveRule({ name: 'Rule A', enabled: true, platform: 'all', ruleType: 'link_spam', threshold: 1, windowSeconds: 10, action: 'delete', muteDurationMinutes: null })
      saveRule({ name: 'Rule B', enabled: false, platform: 'discord', ruleType: 'caps_flood', threshold: 80, windowSeconds: 10, action: 'warn', muteDurationMinutes: null })

      const rules = getRules()
      expect(rules.length).toBe(2)
    })

    it('updates a rule', () => {
      const created = saveRule({ name: 'Original', enabled: true, platform: 'all', ruleType: 'link_spam', threshold: 1, windowSeconds: 10, action: 'delete', muteDurationMinutes: null })
      const updated = saveRule({ id: created.id, name: 'Updated', enabled: false, platform: 'discord', ruleType: 'link_spam', threshold: 5, windowSeconds: 30, action: 'mute', muteDurationMinutes: 15 })

      expect(updated.id).toBe(created.id)
      expect(updated.name).toBe('Updated')
      expect(updated.enabled).toBe(false)
      expect(updated.threshold).toBe(5)
    })

    it('deletes a rule', () => {
      const rule = saveRule({ name: 'Delete me', enabled: true, platform: 'all', ruleType: 'link_spam', threshold: 1, windowSeconds: 10, action: 'delete', muteDurationMinutes: null })
      deleteRule(rule.id)
      expect(getRules().length).toBe(0)
    })

    it('toggles a rule', () => {
      const rule = saveRule({ name: 'Toggle', enabled: true, platform: 'all', ruleType: 'link_spam', threshold: 1, windowSeconds: 10, action: 'delete', muteDurationMinutes: null })
      toggleRule(rule.id, false)

      const rules = getRules()
      expect(rules[0].enabled).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // Spam events
  // -----------------------------------------------------------------------

  describe('spam events', () => {
    it('logs and retrieves spam events', () => {
      logSpamEvent({
        platform: 'discord',
        userId: 'u1',
        username: 'Spammer',
        channelId: 'ch1',
        ruleType: 'message_rate',
        ruleName: 'Rate limit',
        actionTaken: 'mute',
        messageContent: 'spam content'
      })

      const events = getSpamEvents({})
      expect(events.length).toBe(1)
      expect(events[0].username).toBe('Spammer')
      expect(events[0].ruleType).toBe('message_rate')
      expect(events[0].actionTaken).toBe('mute')
    })

    it('filters by platform', () => {
      logSpamEvent({ platform: 'discord', userId: 'u1', username: 'A', channelId: 'ch1', ruleType: 'link_spam', ruleName: 'Links', actionTaken: 'delete', messageContent: null })
      logSpamEvent({ platform: 'telegram', userId: 'u2', username: 'B', channelId: 'ch2', ruleType: 'link_spam', ruleName: 'Links', actionTaken: 'delete', messageContent: null })

      const discord = getSpamEvents({ platform: 'discord' })
      expect(discord.length).toBe(1)
      expect(discord[0].platform).toBe('discord')
    })

    it('filters by rule type', () => {
      logSpamEvent({ platform: 'discord', userId: 'u1', username: 'A', channelId: 'ch1', ruleType: 'link_spam', ruleName: 'Links', actionTaken: 'delete', messageContent: null })
      logSpamEvent({ platform: 'discord', userId: 'u2', username: 'B', channelId: 'ch2', ruleType: 'caps_flood', ruleName: 'Caps', actionTaken: 'warn', messageContent: null })

      const caps = getSpamEvents({ ruleType: 'caps_flood' })
      expect(caps.length).toBe(1)
      expect(caps[0].ruleType).toBe('caps_flood')
    })

    it('respects limit and offset', () => {
      for (let i = 0; i < 10; i++) {
        logSpamEvent({ platform: 'discord', userId: `u${i}`, username: `User${i}`, channelId: 'ch1', ruleType: 'message_rate', ruleName: 'Rate', actionTaken: 'mute', messageContent: null })
      }

      const page = getSpamEvents({ limit: 3, offset: 0 })
      expect(page.length).toBe(3)
    })
  })

  // -----------------------------------------------------------------------
  // Raid events
  // -----------------------------------------------------------------------

  describe('raid events', () => {
    it('logs a raid event', () => {
      const event = logRaidEvent('discord', 'active', 15, 30, 'slowmode,notify_owner')
      expect(event.id).toBeGreaterThan(0)
      expect(event.state).toBe('active')
      expect(event.joinCount).toBe(15)
    })

    it('retrieves raid events', () => {
      logRaidEvent('discord', 'active', 10, 30, 'slowmode')
      logRaidEvent('telegram', 'suspected', 6, 30, '')

      const events = getRaidEvents(10)
      expect(events.length).toBe(2)
    })

    it('resolves a raid event', () => {
      const event = logRaidEvent('discord', 'active', 10, 30, 'slowmode')
      resolveRaidEvent(event.id)

      const latest = getLatestActiveRaid()
      expect(latest).toBeNull()
    })

    it('finds latest active raid', () => {
      logRaidEvent('discord', 'active', 10, 30, 'slowmode')

      const latest = getLatestActiveRaid()
      expect(latest).not.toBeNull()
      expect(latest!.state).toBe('active')
    })
  })
})
