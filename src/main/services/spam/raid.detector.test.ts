import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../../test/db-helper'

let db: Database.Database

vi.mock('../database.service', () => ({
  getDatabase: () => db
}))

import { recordJoin, getRaidState, setManualLockdown, resetRaidState } from './raid.detector'
import { getSpamConfig, updateSpamConfig, getRaidEvents, getLatestActiveRaid } from './spam.repository'

describe('RaidDetector', () => {
  beforeEach(() => {
    db = createTestDatabase()
    resetRaidState()
  })

  afterEach(() => {
    resetRaidState()
    closeTestDatabase()
  })

  // -----------------------------------------------------------------------
  // Normal joins — no raid
  // -----------------------------------------------------------------------

  describe('normal joins', () => {
    it('does not trigger on a few joins', () => {
      const result = recordJoin('discord', 'u1', 'Alice')
      expect(result.stateChanged).toBe(false)
      expect(result.newState).toBe('normal')
    })

    it('tracks join count', () => {
      recordJoin('discord', 'u1', 'Alice')
      recordJoin('discord', 'u2', 'Bob')
      const result = recordJoin('discord', 'u3', 'Charlie')
      expect(result.joinCount).toBe(3)
    })
  })

  // -----------------------------------------------------------------------
  // Suspected state
  // -----------------------------------------------------------------------

  describe('suspected state', () => {
    it('transitions to suspected at 60% of threshold', () => {
      // Default threshold: 10, so 60% = 6 joins
      let result
      for (let i = 0; i < 6; i++) {
        result = recordJoin('discord', `suspect-${i}`, `User${i}`)
      }
      expect(result!.newState).toBe('suspected')
      expect(result!.stateChanged).toBe(true)
    })

    it('reports suspected via getRaidState', () => {
      for (let i = 0; i < 6; i++) {
        recordJoin('discord', `state-${i}`, `User${i}`)
      }
      expect(getRaidState('discord')).toBe('suspected')
    })
  })

  // -----------------------------------------------------------------------
  // Active state
  // -----------------------------------------------------------------------

  describe('active state', () => {
    it('transitions to active at threshold', () => {
      // Default threshold: 10 joins in 30 seconds
      let result
      for (let i = 0; i < 10; i++) {
        result = recordJoin('discord', `raid-${i}`, `Raider${i}`)
      }
      expect(result!.newState).toBe('active')
      expect(result!.stateChanged).toBe(true)
      expect(result!.actions.length).toBeGreaterThan(0)
    })

    it('logs raid event to database', () => {
      for (let i = 0; i < 10; i++) {
        recordJoin('discord', `db-raid-${i}`, `Raider${i}`)
      }

      const events = getRaidEvents(10)
      expect(events.length).toBe(1)
      expect(events[0].state).toBe('active')
      expect(events[0].platform).toBe('discord')
      expect(events[0].joinCount).toBe(10)
    })

    it('includes configured actions in result', () => {
      const config = getSpamConfig()
      updateSpamConfig({
        ...config,
        raid: { ...config.raid, autoSlowmode: true, autoLockdown: true, notifyOwner: true, autoBanNewAccounts: false }
      })

      let result
      for (let i = 0; i < 10; i++) {
        result = recordJoin('discord', `action-${i}`, `Raider${i}`)
      }
      expect(result!.actions).toContain('slowmode')
      expect(result!.actions).toContain('lockdown')
      expect(result!.actions).toContain('notify_owner')
      expect(result!.actions).not.toContain('ban_new_accounts')
    })

    it('does not re-trigger on subsequent joins', () => {
      for (let i = 0; i < 10; i++) {
        recordJoin('discord', `retrig-${i}`, `Raider${i}`)
      }
      // 11th join — already active
      const result = recordJoin('discord', 'retrig-10', 'Raider10')
      expect(result.stateChanged).toBe(false)
      expect(result.newState).toBe('active')
    })
  })

  // -----------------------------------------------------------------------
  // Suspicious join detection
  // -----------------------------------------------------------------------

  describe('suspicious joins', () => {
    it('flags accounts with sequential numbers in username', () => {
      let result
      for (let i = 0; i < 10; i++) {
        result = recordJoin('discord', `num-${i}`, `spammer${10000 + i}`)
      }
      expect(result!.suspiciousJoins.length).toBeGreaterThan(0)
    })

    it('flags new accounts below age threshold', () => {
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000 // 1 day old, threshold is 7 days

      let result
      for (let i = 0; i < 10; i++) {
        result = recordJoin('discord', `new-${i}`, `NewUser${i}`, oneDayAgo)
      }
      expect(result!.suspiciousJoins.length).toBeGreaterThan(0)
    })

    it('does not flag old accounts', () => {
      const now = Date.now()
      const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000

      let result
      for (let i = 0; i < 10; i++) {
        result = recordJoin('discord', `old-${i}`, `Veteran${i}`, oneYearAgo)
      }
      // Old accounts with normal names should not be suspicious
      const nonNumericSuspicious = result!.suspiciousJoins.filter(
        (j) => !/\d{3,}$/.test(j.username)
      )
      expect(nonNumericSuspicious.length).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // Config respect
  // -----------------------------------------------------------------------

  describe('config', () => {
    it('does nothing when raid protection is disabled', () => {
      const config = getSpamConfig()
      updateSpamConfig({ ...config, raid: { ...config.raid, enabled: false } })

      let result
      for (let i = 0; i < 20; i++) {
        result = recordJoin('discord', `disabled-${i}`, `User${i}`)
      }
      expect(result!.newState).toBe('normal')
      expect(result!.stateChanged).toBe(false)
    })

    it('respects custom join threshold', () => {
      const config = getSpamConfig()
      updateSpamConfig({ ...config, raid: { ...config.raid, joinThreshold: 3, joinWindowSeconds: 60 } })

      recordJoin('discord', 'custom-0', 'User0')
      recordJoin('discord', 'custom-1', 'User1')
      const result = recordJoin('discord', 'custom-2', 'User2')
      expect(result.newState).toBe('active')
    })
  })

  // -----------------------------------------------------------------------
  // Manual lockdown
  // -----------------------------------------------------------------------

  describe('manual lockdown', () => {
    it('sets state to active', () => {
      // Need at least one platform state to exist
      recordJoin('discord', 'lock-user', 'User')
      setManualLockdown(true)
      expect(getRaidState('discord')).toBe('active')
    })

    it('can be disabled', () => {
      recordJoin('discord', 'unlock-user', 'User')
      setManualLockdown(true)
      expect(getRaidState('discord')).toBe('active')
      setManualLockdown(false)
      expect(getRaidState('discord')).toBe('normal')
    })
  })

  // -----------------------------------------------------------------------
  // Cross-platform isolation
  // -----------------------------------------------------------------------

  describe('platform isolation', () => {
    it('tracks platforms separately', () => {
      for (let i = 0; i < 6; i++) {
        recordJoin('discord', `iso-d-${i}`, `DiscordUser${i}`)
      }
      // Discord should be suspected
      expect(getRaidState('discord')).toBe('suspected')
      // Telegram should still be normal
      expect(getRaidState('telegram')).toBe('normal')
    })

    it('getRaidState without platform returns worst state', () => {
      for (let i = 0; i < 10; i++) {
        recordJoin('discord', `worst-${i}`, `Raider${i}`)
      }
      // Discord is active, telegram doesn't exist
      expect(getRaidState()).toBe('active')
    })
  })
})
