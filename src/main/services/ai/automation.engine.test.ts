import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../../test/db-helper'

let db: Database.Database

vi.mock('../database.service', () => ({
  getDatabase: () => db
}))

import { AutomationEngine } from './automation.engine'
import type { AutomationEvent } from './automation.engine'
import { saveAutomation } from './agent.repository'

describe('AutomationEngine', () => {
  let engine: AutomationEngine

  beforeEach(() => {
    db = createTestDatabase()
    engine = new AutomationEngine()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  const messageEvent: AutomationEvent = {
    type: 'message',
    platform: 'discord',
    channelId: 'ch-1',
    userId: 'u-1',
    username: 'Alice',
    content: 'Hello everyone!'
  }

  const newMemberEvent: AutomationEvent = {
    type: 'new_member',
    platform: 'discord',
    channelId: 'ch-1',
    userId: 'u-2',
    username: 'Bob'
  }

  describe('evaluate', () => {
    it('matches keyword trigger', () => {
      saveAutomation({
        name: 'Greeting',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'Hi {username}!' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(1)
      expect(matches[0].responseText).toBe('Hi Alice!')
    })

    it('matches regex trigger', () => {
      saveAutomation({
        name: 'URL detector',
        trigger: { type: 'regex', value: 'https?://' },
        action: { type: 'reply', payload: { template: 'Link detected from {username}' } },
        enabled: true
      })
      engine.refresh()

      const event = { ...messageEvent, content: 'Check https://example.com' }
      const matches = engine.evaluate(event)
      expect(matches.length).toBe(1)
    })

    it('matches new_member trigger', () => {
      saveAutomation({
        name: 'Welcome',
        trigger: { type: 'new_member', value: '' },
        action: { type: 'reply', payload: { template: 'Welcome {username} to {platform}!' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(newMemberEvent)
      expect(matches.length).toBe(1)
      expect(matches[0].responseText).toBe('Welcome Bob to discord!')
    })

    it('skips disabled automations', () => {
      saveAutomation({
        name: 'Disabled',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'response' } },
        enabled: false
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(0)
    })

    it('skips platform-specific automations for wrong platform', () => {
      saveAutomation({
        name: 'Telegram only',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'response' } },
        platform: 'telegram',
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent) // discord event
      expect(matches.length).toBe(0)
    })

    it('matches platform-specific automation for correct platform', () => {
      saveAutomation({
        name: 'Discord only',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'Discord response' } },
        platform: 'discord',
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(1)
    })

    it('handles invalid regex gracefully', () => {
      saveAutomation({
        name: 'Bad regex',
        trigger: { type: 'regex', value: '(invalid[' },
        action: { type: 'reply', payload: { template: 'response' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(0)
    })

    it('does not match inactivity or schedule triggers per-event', () => {
      saveAutomation({
        name: 'Scheduled',
        trigger: { type: 'schedule', value: '0 9 * * *' },
        action: { type: 'post', payload: { template: 'Good morning' } },
        enabled: true
      })
      saveAutomation({
        name: 'Inactive',
        trigger: { type: 'inactivity', value: '7' },
        action: { type: 'dm', payload: { template: 'We miss you' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(0)
    })

    it('matches multiple automations', () => {
      saveAutomation({
        name: 'Greeting',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'Hi!' } },
        enabled: true
      })
      saveAutomation({
        name: 'Everyone',
        trigger: { type: 'keyword', value: 'everyone' },
        action: { type: 'reply', payload: { template: 'Hey!' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches.length).toBe(2)
    })

    it('creates action records for matches', () => {
      saveAutomation({
        name: 'Test',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'Hi!' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches[0].action.id).toBeGreaterThan(0)
      expect(matches[0].action.actionType).toBe('replied')
      expect(matches[0].action.platform).toBe('discord')
    })

    it('interpolates {message} template variable', () => {
      saveAutomation({
        name: 'Echo',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'reply', payload: { template: 'You said: {message}' } },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches[0].responseText).toBe('You said: Hello everyone!')
    })

    it('returns null responseText when no template', () => {
      saveAutomation({
        name: 'No template',
        trigger: { type: 'keyword', value: 'hello' },
        action: { type: 'moderate', payload: {} },
        enabled: true
      })
      engine.refresh()

      const matches = engine.evaluate(messageEvent)
      expect(matches[0].responseText).toBeNull()
    })
  })
})
