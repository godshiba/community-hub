import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../../test/db-helper'

let db: Database.Database

vi.mock('../database.service', () => ({
  getDatabase: () => db
}))

import {
  getProfile,
  upsertProfile,
  getPatterns,
  savePattern,
  deletePattern,
  incrementPatternUsage,
  getAutomations,
  saveAutomation,
  deleteAutomation,
  toggleAutomation,
  markAutomationTriggered,
  getActions,
  createAction,
  updateActionStatus,
  updateActionOutput,
  countTodayActions,
  countPendingActions
} from './agent.repository'

describe('agent.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('Profile CRUD', () => {
    it('returns null when no profile exists', () => {
      expect(getProfile()).toBeNull()
    })

    it('creates a new profile via upsert', () => {
      const profile = upsertProfile({
        name: 'CommunityBot',
        role: 'moderator',
        tone: 'friendly',
        knowledge: 'community rules',
        boundaries: 'no personal info',
        language: 'en',
        respondMode: 'mentioned'
      })

      expect(profile.name).toBe('CommunityBot')
      expect(profile.role).toBe('moderator')
      expect(profile.respondMode).toBe('mentioned')
    })

    it('updates existing profile via upsert', () => {
      upsertProfile({ name: 'Bot V1', language: 'en' })
      const updated = upsertProfile({ name: 'Bot V2', language: 'es' })
      expect(updated.name).toBe('Bot V2')
      expect(updated.language).toBe('es')

      // Should still be one profile
      const all = db.prepare('SELECT COUNT(*) as count FROM agent_profile').get() as { count: number }
      expect(all.count).toBe(1)
    })

    it('defaults respondMode to mentioned', () => {
      const profile = upsertProfile({ name: 'Bot' })
      expect(profile.respondMode).toBe('mentioned')
    })
  })

  describe('Pattern CRUD', () => {
    it('creates and retrieves patterns', () => {
      const pattern = savePattern({
        triggerType: 'keyword',
        triggerValue: 'hello',
        responseTemplate: 'Hi {username}!',
        platform: 'discord',
        enabled: true
      })

      expect(pattern.id).toBeGreaterThan(0)
      expect(pattern.triggerType).toBe('keyword')
      expect(pattern.enabled).toBe(true)
      expect(pattern.usageCount).toBe(0)

      const all = getPatterns()
      expect(all.length).toBe(1)
    })

    it('deletes a pattern', () => {
      const pattern = savePattern({
        triggerType: 'regex',
        triggerValue: '.*help.*',
        responseTemplate: 'How can I help?'
      })

      deletePattern(pattern.id)
      expect(getPatterns().length).toBe(0)
    })

    it('increments usage count', () => {
      const pattern = savePattern({
        triggerType: 'keyword',
        triggerValue: 'test',
        responseTemplate: 'response'
      })

      incrementPatternUsage(pattern.id)
      incrementPatternUsage(pattern.id)

      const row = db.prepare('SELECT usage_count FROM agent_patterns WHERE id = ?').get(pattern.id) as { usage_count: number }
      expect(row.usage_count).toBe(2)
    })

    it('creates disabled pattern', () => {
      const pattern = savePattern({
        triggerType: 'keyword',
        triggerValue: 'test',
        responseTemplate: 'response',
        enabled: false
      })
      expect(pattern.enabled).toBe(false)
    })
  })

  describe('Automation CRUD', () => {
    it('creates and retrieves automations', () => {
      const automation = saveAutomation({
        name: 'Welcome New Members',
        trigger: { type: 'new_member', value: '' },
        action: { type: 'reply', payload: { template: 'Welcome {username}!' } },
        platform: 'discord',
        enabled: true
      })

      expect(automation.id).toBeGreaterThan(0)
      expect(automation.name).toBe('Welcome New Members')
      expect(automation.trigger.type).toBe('new_member')
      expect(automation.enabled).toBe(true)

      const all = getAutomations()
      expect(all.length).toBe(1)
    })

    it('toggles automation enabled state', () => {
      const automation = saveAutomation({
        name: 'Test',
        trigger: { type: 'keyword', value: 'hi' },
        action: { type: 'reply', payload: {} }
      })

      toggleAutomation(automation.id, false)
      let row = db.prepare('SELECT enabled FROM agent_automations WHERE id = ?').get(automation.id) as { enabled: number }
      expect(row.enabled).toBe(0)

      toggleAutomation(automation.id, true)
      row = db.prepare('SELECT enabled FROM agent_automations WHERE id = ?').get(automation.id) as { enabled: number }
      expect(row.enabled).toBe(1)
    })

    it('deletes an automation', () => {
      const automation = saveAutomation({
        name: 'Test',
        trigger: { type: 'keyword', value: 'hi' },
        action: { type: 'reply', payload: {} }
      })
      deleteAutomation(automation.id)
      expect(getAutomations().length).toBe(0)
    })

    it('marks automation as triggered', () => {
      const automation = saveAutomation({
        name: 'Test',
        trigger: { type: 'keyword', value: 'hi' },
        action: { type: 'reply', payload: {} }
      })

      markAutomationTriggered(automation.id)
      const row = db.prepare('SELECT last_triggered FROM agent_automations WHERE id = ?').get(automation.id) as { last_triggered: string }
      expect(row.last_triggered).not.toBeNull()
    })
  })

  describe('Action CRUD', () => {
    it('creates an action', () => {
      const action = createAction({
        actionType: 'replied',
        platform: 'discord',
        context: '{"channel": "general"}',
        input: 'Hello',
        output: 'Hi there!',
        status: 'completed'
      })

      expect(action.id).toBeGreaterThan(0)
      expect(action.actionType).toBe('replied')
      expect(action.status).toBe('completed')
    })

    it('filters actions by type, platform, and status', () => {
      createAction({ actionType: 'replied', platform: 'discord' })
      createAction({ actionType: 'moderated', platform: 'telegram' })
      createAction({ actionType: 'replied', platform: 'telegram', status: 'pending' })

      expect(getActions({ actionType: 'replied' }).length).toBe(2)
      expect(getActions({ platform: 'telegram' }).length).toBe(2)
      expect(getActions({ status: 'pending' }).length).toBe(1)
    })

    it('supports limit and offset', () => {
      for (let i = 0; i < 10; i++) {
        createAction({ actionType: 'replied', platform: 'discord' })
      }

      expect(getActions({ limit: 3 }).length).toBe(3)
      expect(getActions({ limit: 3, offset: 8 }).length).toBe(2)
    })

    it('updates action status', () => {
      const action = createAction({ actionType: 'replied', platform: 'discord', status: 'pending' })
      updateActionStatus(action.id, 'approved')

      const row = db.prepare('SELECT status FROM agent_actions WHERE id = ?').get(action.id) as { status: string }
      expect(row.status).toBe('approved')
    })

    it('updates action status with correction', () => {
      const action = createAction({ actionType: 'replied', platform: 'discord', status: 'pending' })
      updateActionStatus(action.id, 'approved', 'Modified response')

      const row = db.prepare('SELECT status, correction FROM agent_actions WHERE id = ?').get(action.id) as { status: string; correction: string }
      expect(row.status).toBe('approved')
      expect(row.correction).toBe('Modified response')
    })

    it('updates action output', () => {
      const action = createAction({ actionType: 'replied', platform: 'discord' })
      updateActionOutput(action.id, 'New output text')

      const row = db.prepare('SELECT output FROM agent_actions WHERE id = ?').get(action.id) as { output: string }
      expect(row.output).toBe('New output text')
    })

    it('counts today actions', () => {
      createAction({ actionType: 'replied', platform: 'discord' })
      createAction({ actionType: 'moderated', platform: 'discord' })
      expect(countTodayActions()).toBe(2)
    })

    it('counts pending actions', () => {
      createAction({ actionType: 'replied', platform: 'discord', status: 'pending' })
      createAction({ actionType: 'replied', platform: 'discord', status: 'completed' })
      expect(countPendingActions()).toBe(1)
    })
  })
})
