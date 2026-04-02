import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

// Mock database.service before importing repository
let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

// Import after mock
import {
  saveCredential,
  loadCredential,
  loadCredentialsState,
  updateLastVerified,
  deleteCredential,
  saveAiConfig,
  loadAiConfig,
  savePreferences,
  loadPreferences
} from './credentials.repository'

describe('credentials.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('saveCredential / loadCredential', () => {
    it('saves and loads a discord credential', () => {
      saveCredential({ platform: 'discord', token: 'tok-discord-123' })
      const cred = loadCredential('discord')
      expect(cred).not.toBeNull()
      expect(cred!.platform).toBe('discord')
      expect(cred!.token).toBe('tok-discord-123')
      expect(cred!.secret).toBeNull()
      expect(cred!.userId).toBeNull()
    })

    it('saves credential with secret and userId', () => {
      saveCredential({
        platform: 'telegram',
        token: 'tok-tg-456',
        secret: 'sec-789',
        userId: 'user-1'
      })
      const cred = loadCredential('telegram')
      expect(cred!.secret).toBe('sec-789')
      expect(cred!.userId).toBe('user-1')
    })

    it('upserts on conflict (same platform)', () => {
      saveCredential({ platform: 'discord', token: 'old-token' })
      saveCredential({ platform: 'discord', token: 'new-token' })
      const cred = loadCredential('discord')
      expect(cred!.token).toBe('new-token')
    })

    it('returns null for non-existent platform', () => {
      expect(loadCredential('discord')).toBeNull()
    })
  })

  describe('loadCredentialsState', () => {
    it('returns unconfigured state when no credentials saved', () => {
      const state = loadCredentialsState()
      expect(state.discord.configured).toBe(false)
      expect(state.telegram.configured).toBe(false)
    })

    it('returns configured state after saving', () => {
      saveCredential({ platform: 'discord', token: 'tok' })
      const state = loadCredentialsState()
      expect(state.discord.configured).toBe(true)
      expect(state.telegram.configured).toBe(false)
    })
  })

  describe('updateLastVerified', () => {
    it('updates last_verified timestamp', () => {
      saveCredential({ platform: 'discord', token: 'tok' })
      updateLastVerified('discord')
      const cred = loadCredential('discord')
      expect(cred!.lastVerified).not.toBeNull()
    })
  })

  describe('deleteCredential', () => {
    it('removes credential', () => {
      saveCredential({ platform: 'discord', token: 'tok' })
      deleteCredential('discord')
      expect(loadCredential('discord')).toBeNull()
    })

    it('does nothing for non-existent credential', () => {
      expect(() => deleteCredential('discord')).not.toThrow()
    })
  })

  describe('saveAiConfig / loadAiConfig', () => {
    it('saves and loads AI config', () => {
      saveAiConfig({
        provider: 'claude',
        apiKey: 'sk-test',
        model: 'claude-sonnet-4-5-20250514',
        temperature: 0.5
      })
      const config = loadAiConfig()
      expect(config.provider).toBe('claude')
      expect(config.apiKey).toBe('sk-test')
      expect(config.model).toBe('claude-sonnet-4-5-20250514')
      expect(config.temperature).toBe(0.5)
    })

    it('returns defaults when no config saved', () => {
      const config = loadAiConfig()
      expect(config.provider).toBeNull()
      expect(config.apiKey).toBe('')
      expect(config.temperature).toBe(0.7)
    })

    it('treats empty provider as null', () => {
      saveAiConfig({ provider: null, apiKey: '', model: '', temperature: 0.7 })
      const config = loadAiConfig()
      expect(config.provider).toBeNull()
    })
  })

  describe('savePreferences / loadPreferences', () => {
    it('saves and loads preferences', () => {
      savePreferences({
        statsRefreshMinutes: 30,
        memberSyncHours: 12,
        panelLayoutPersist: false
      })
      const prefs = loadPreferences()
      expect(prefs.statsRefreshMinutes).toBe(30)
      expect(prefs.memberSyncHours).toBe(12)
      expect(prefs.panelLayoutPersist).toBe(false)
    })

    it('returns defaults when no preferences saved', () => {
      const prefs = loadPreferences()
      expect(prefs.statsRefreshMinutes).toBe(60)
      expect(prefs.memberSyncHours).toBe(6)
      expect(prefs.panelLayoutPersist).toBe(true)
    })
  })
})
