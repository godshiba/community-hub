import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../../test/db-helper'

let db: Database.Database

vi.mock('../database.service', () => ({
  getDatabase: () => db
}))

import { checkMessage, computeSimilarity, testRule, resetTrackers } from './spam.engine'
import { getSpamConfig, updateSpamConfig } from './spam.repository'

describe('SpamEngine', () => {
  beforeEach(() => {
    db = createTestDatabase()
    resetTrackers()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  // -----------------------------------------------------------------------
  // Similarity algorithm
  // -----------------------------------------------------------------------

  describe('computeSimilarity', () => {
    it('returns 100 for identical strings', () => {
      expect(computeSimilarity('hello world', 'hello world')).toBe(100)
    })

    it('returns 0 for completely different strings', () => {
      expect(computeSimilarity('ab', 'yz')).toBe(0)
    })

    it('returns high similarity for near-duplicates', () => {
      const sim = computeSimilarity('buy cheap stuff now!', 'buy cheap stuff now!!')
      expect(sim).toBeGreaterThan(80)
    })

    it('returns low similarity for different messages', () => {
      const sim = computeSimilarity('hello everyone', 'the weather is nice')
      expect(sim).toBeLessThan(40)
    })

    it('handles single-char strings', () => {
      expect(computeSimilarity('a', 'b')).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // Message rate limit
  // -----------------------------------------------------------------------

  describe('message rate limit', () => {
    it('does not trigger below threshold', () => {
      const messages = ['hello world', 'the weather is great', 'what is for lunch', 'anyone seen the news']
      for (let i = 0; i < 4; i++) {
        const result = checkMessage('discord', 'user1', 'User1', 'ch1', `msg${i}`, messages[i])
        expect(result).toBeNull()
      }
    })

    it('triggers when rate limit exceeded', () => {
      // Default: 5 messages in 10 seconds
      const msgs = ['alpha bravo', 'charlie delta', 'echo foxtrot', 'golf hotel']
      for (let i = 0; i < 4; i++) {
        checkMessage('discord', 'user-rate', 'User', 'ch1', `m${i}`, msgs[i])
      }
      const result = checkMessage('discord', 'user-rate', 'User', 'ch1', 'm4', 'india juliet')
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('message_rate')
      expect(result!.triggered).toBe(true)
    })

    it('returns all message refs when triggered', () => {
      const msgs = ['alpha bravo', 'charlie delta', 'echo foxtrot', 'golf hotel']
      for (let i = 0; i < 4; i++) {
        checkMessage('discord', 'user-refs', 'User', 'ch1', `ref${i}`, msgs[i])
      }
      const result = checkMessage('discord', 'user-refs', 'User', 'ch1', 'ref4', 'india juliet')
      expect(result).not.toBeNull()
      expect(result!.messageRefs.length).toBe(5)
      expect(result!.messageRefs[0].messageId).toBe('ref0')
      expect(result!.messageRefs[4].messageId).toBe('ref4')
    })

    it('tracks users independently', () => {
      const msgs = ['alpha bravo', 'charlie delta', 'echo foxtrot', 'golf hotel']
      for (let i = 0; i < 4; i++) {
        checkMessage('discord', 'userA', 'A', 'ch1', `a${i}`, msgs[i])
      }
      // Different user should not trigger
      const result = checkMessage('discord', 'userB', 'B', 'ch1', 'b0', 'msg 0')
      expect(result).toBeNull()
    })

    it('tracks platforms independently', () => {
      const msgs = ['alpha bravo', 'charlie delta', 'echo foxtrot', 'golf hotel']
      for (let i = 0; i < 4; i++) {
        checkMessage('discord', 'cross-plat', 'User', 'ch1', `d${i}`, msgs[i])
      }
      // Same userId on telegram — separate tracker
      const result = checkMessage('telegram', 'cross-plat', 'User', 'ch1', 't0', 'hello there')
      expect(result).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // Duplicate detection
  // -----------------------------------------------------------------------

  describe('duplicate detection', () => {
    it('detects repeated identical messages', () => {
      checkMessage('discord', 'dupe-user', 'User', 'ch1', 'd0', 'buy crypto now free money')
      const result = checkMessage('discord', 'dupe-user', 'User', 'ch1', 'd1', 'buy crypto now free money')
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('duplicate_message')
    })

    it('detects near-duplicate messages', () => {
      checkMessage('discord', 'dupe-near', 'User', 'ch1', 'n0', 'check out this amazing deal at mysite dot com')
      const result = checkMessage('discord', 'dupe-near', 'User', 'ch1', 'n1', 'check out this amazing deal at mysite dot org')
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('duplicate_message')
    })

    it('allows different messages from same user', () => {
      checkMessage('discord', 'dupe-ok', 'User', 'ch1', 'ok0', 'hello everyone')
      const result = checkMessage('discord', 'dupe-ok', 'User', 'ch1', 'ok1', 'the weather is nice today')
      expect(result).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // Link spam
  // -----------------------------------------------------------------------

  describe('link spam', () => {
    it('allows messages within link limit', () => {
      const result = checkMessage('discord', 'link-ok', 'User', 'ch1', 'l0', 'Check https://example.com and https://test.com')
      expect(result).toBeNull()
    })

    it('triggers on excessive links', () => {
      const msg = 'Visit https://a.com https://b.com https://c.com https://d.com for deals'
      const result = checkMessage('discord', 'link-spam', 'User', 'ch1', 'ls0', msg)
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('link_spam')
    })
  })

  // -----------------------------------------------------------------------
  // Mention spam
  // -----------------------------------------------------------------------

  describe('mention spam', () => {
    it('allows normal mentions', () => {
      const result = checkMessage('discord', 'mention-ok', 'User', 'ch1', 'mt0', 'Hey <@123> check this')
      expect(result).toBeNull()
    })

    it('triggers on mass Discord mentions', () => {
      const msg = '<@1> <@2> <@3> <@4> <@5> <@6> look at this'
      const result = checkMessage('discord', 'mention-spam', 'User', 'ch1', 'ms0', msg)
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('mention_spam')
    })

    it('triggers on mass Telegram mentions', () => {
      const msg = '@user1 @user2 @user3 @user4 @user5 @user6 join now'
      const result = checkMessage('telegram', 'mention-tg', 'User', 'ch1', 'tg0', msg)
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('mention_spam')
    })
  })

  // -----------------------------------------------------------------------
  // Emoji flood
  // -----------------------------------------------------------------------

  describe('emoji flood', () => {
    it('allows normal emoji usage', () => {
      const result = checkMessage('discord', 'emoji-ok', 'User', 'ch1', 'e0', 'Great job! \u{1F44D}\u{1F44D}\u{1F44D}')
      expect(result).toBeNull()
    })

    it('triggers on emoji flood', () => {
      const emoji = '\u{1F525}'.repeat(20)
      const result = checkMessage('discord', 'emoji-flood', 'User', 'ch1', 'ef0', emoji)
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('emoji_flood')
    })

    it('counts Discord custom emoji', () => {
      const customEmoji = Array.from({ length: 20 }, (_, i) => `<:emoji${i}:${100 + i}>`).join('')
      const result = checkMessage('discord', 'custom-emoji', 'User', 'ch1', 'ce0', customEmoji)
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('emoji_flood')
    })
  })

  // -----------------------------------------------------------------------
  // Caps flood
  // -----------------------------------------------------------------------

  describe('caps flood', () => {
    it('ignores short messages', () => {
      const result = checkMessage('discord', 'caps-short', 'User', 'ch1', 'cs0', 'HI THERE')
      expect(result).toBeNull()
    })

    it('allows normal capitalization', () => {
      const result = checkMessage('discord', 'caps-ok', 'User', 'ch1', 'co0', 'Hello everyone, how is it going today?')
      expect(result).toBeNull()
    })

    it('triggers on all-caps long message', () => {
      const result = checkMessage('discord', 'caps-spam', 'User', 'ch1', 'cp0', 'THIS IS ALL CAPS AND IT IS VERY ANNOYING TO READ IN CHAT')
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('caps_flood')
    })
  })

  // -----------------------------------------------------------------------
  // Config respect
  // -----------------------------------------------------------------------

  describe('config', () => {
    it('returns null when flood protection is disabled', () => {
      const config = getSpamConfig()
      updateSpamConfig({ ...config, flood: { ...config.flood, enabled: false } })

      // Even excessive spam should pass
      for (let i = 0; i < 10; i++) {
        const result = checkMessage('discord', 'disabled-user', 'User', 'ch1', `dis${i}`, `unique message number ${i} with random content ${Math.random()}`)
        expect(result).toBeNull()
      }
    })

    it('respects custom thresholds', () => {
      const config = getSpamConfig()
      updateSpamConfig({
        ...config,
        flood: { ...config.flood, messageRateLimit: 2, messageRateWindowSeconds: 60 }
      })

      checkMessage('discord', 'custom-thresh', 'User', 'ch1', 'ct0', 'msg 1')
      const result = checkMessage('discord', 'custom-thresh', 'User', 'ch1', 'ct1', 'msg 2')
      expect(result).not.toBeNull()
      expect(result!.ruleType).toBe('message_rate')
    })

    it('respects custom action setting', () => {
      const config = getSpamConfig()
      updateSpamConfig({
        ...config,
        flood: { ...config.flood, defaultAction: 'ban', messageRateLimit: 2 }
      })

      checkMessage('discord', 'ban-action', 'User', 'ch1', 'ba0', 'msg 1')
      const result = checkMessage('discord', 'ban-action', 'User', 'ch1', 'ba1', 'msg 2')
      expect(result).not.toBeNull()
      expect(result!.action).toBe('ban')
    })
  })

  // -----------------------------------------------------------------------
  // Cooldown
  // -----------------------------------------------------------------------

  describe('cooldown', () => {
    it('does not double-trigger within cooldown window', () => {
      const msgs = ['alpha bravo', 'charlie delta', 'echo foxtrot', 'golf hotel']
      for (let i = 0; i < 4; i++) {
        checkMessage('discord', 'cool-user', 'User', 'ch1', `cu${i}`, msgs[i])
      }
      const first = checkMessage('discord', 'cool-user', 'User', 'ch1', 'cu4', 'india juliet')
      expect(first).not.toBeNull()

      // Immediate next message should be skipped (5s cooldown)
      const second = checkMessage('discord', 'cool-user', 'User', 'ch1', 'cu5', 'kilo lima')
      expect(second).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // testRule (UI preview)
  // -----------------------------------------------------------------------

  describe('testRule', () => {
    it('detects link spam in test mode', () => {
      const result = testRule('link_spam', 'https://a.com https://b.com https://c.com https://d.com')
      expect(result.triggered).toBe(true)
    })

    it('passes clean content in test mode', () => {
      const result = testRule('link_spam', 'just a normal message')
      expect(result.triggered).toBe(false)
    })

    it('detects caps flood in test mode', () => {
      const result = testRule('caps_flood', 'THIS IS ALL CAPS AND VERY LONG MESSAGE FOR TESTING')
      expect(result.triggered).toBe(true)
    })

    it('returns not-triggered for rate-based rules', () => {
      const result = testRule('message_rate', 'any content')
      expect(result.triggered).toBe(false)
    })
  })
})
