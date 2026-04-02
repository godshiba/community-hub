import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

import {
  getMembers,
  getMemberById,
  getMemberDetail,
  getMemberByPlatformId,
  upsertMember,
  addWarning,
  banMember,
  unbanMember,
  updateNotes,
  exportMembers
} from './moderation.repository'

describe('moderation.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('upsertMember', () => {
    it('creates a new member', () => {
      const member = upsertMember('discord', 'usr-1', 'Alice', '2024-01-01')
      expect(member.id).toBeGreaterThan(0)
      expect(member.username).toBe('Alice')
      expect(member.platform).toBe('discord')
      expect(member.status).toBe('active')
    })

    it('updates existing member on conflict', () => {
      upsertMember('discord', 'usr-1', 'Alice', '2024-01-01')
      const updated = upsertMember('discord', 'usr-1', 'Alice_v2', '2024-01-01')
      expect(updated.username).toBe('Alice_v2')
    })

    it('creates members on different platforms independently', () => {
      upsertMember('discord', 'usr-1', 'Alice', null)
      upsertMember('telegram', 'usr-1', 'Alice', null)
      const { total } = getMembers({})
      expect(total).toBe(2)
    })
  })

  describe('getMembers', () => {
    beforeEach(() => {
      upsertMember('discord', 'u1', 'Alice', null)
      upsertMember('discord', 'u2', 'Bob', null)
      upsertMember('telegram', 'u3', 'Charlie', null)
    })

    it('returns all members without filter', () => {
      const page = getMembers({})
      expect(page.total).toBe(3)
      expect(page.members.length).toBe(3)
    })

    it('filters by platform', () => {
      const page = getMembers({ platform: 'discord' })
      expect(page.total).toBe(2)
    })

    it('filters by search', () => {
      const page = getMembers({ search: 'ali' })
      expect(page.total).toBe(1)
      expect(page.members[0].username).toBe('Alice')
    })

    it('paginates results', () => {
      const page = getMembers({ page: 1, pageSize: 2 })
      expect(page.members.length).toBe(2)
      expect(page.total).toBe(3)
      expect(page.page).toBe(1)
      expect(page.pageSize).toBe(2)
    })

    it('sorts by username desc', () => {
      const page = getMembers({ sortBy: 'username', sortDir: 'desc' })
      expect(page.members[0].username).toBe('Charlie')
    })
  })

  describe('getMemberById / getMemberByPlatformId', () => {
    it('finds member by id', () => {
      const created = upsertMember('discord', 'u1', 'Alice', null)
      const found = getMemberById(created.id)
      expect(found).toBeDefined()
      expect(found!.username).toBe('Alice')
    })

    it('returns undefined for non-existent id', () => {
      expect(getMemberById(999)).toBeUndefined()
    })

    it('finds member by platform and platform_user_id', () => {
      upsertMember('discord', 'u1', 'Alice', null)
      const found = getMemberByPlatformId('discord', 'u1')
      expect(found).toBeDefined()
      expect(found!.username).toBe('Alice')
    })
  })

  describe('getMemberDetail', () => {
    it('returns member with warnings and actions', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      addWarning(member.id, 'Spam', 'admin')

      const detail = getMemberDetail(member.id)
      expect(detail.member.username).toBe('Alice')
      expect(detail.warnings.length).toBe(1)
      expect(detail.warnings[0].reason).toBe('Spam')
      expect(detail.actions.length).toBe(1)
      expect(detail.actions[0].actionType).toBe('warn')
    })

    it('throws for non-existent member', () => {
      expect(() => getMemberDetail(999)).toThrow('Member 999 not found')
    })
  })

  describe('addWarning', () => {
    it('adds warning and increments count', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      const warning = addWarning(member.id, 'Bad behavior', 'mod-1')

      expect(warning.reason).toBe('Bad behavior')
      expect(warning.givenBy).toBe('mod-1')

      const updated = getMemberById(member.id)!
      expect(updated.warningsCount).toBe(1)
      expect(updated.status).toBe('warned')
    })

    it('accumulates multiple warnings', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      addWarning(member.id, 'First', 'mod')
      addWarning(member.id, 'Second', 'mod')

      const updated = getMemberById(member.id)!
      expect(updated.warningsCount).toBe(2)
    })
  })

  describe('banMember / unbanMember', () => {
    it('bans a member', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      banMember(member.id, 'Repeated violations')

      const updated = getMemberById(member.id)!
      expect(updated.status).toBe('banned')
    })

    it('unbans a member back to active', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      banMember(member.id, 'Reason')
      unbanMember(member.id)

      const updated = getMemberById(member.id)!
      expect(updated.status).toBe('active')
    })
  })

  describe('updateNotes', () => {
    it('updates member notes', () => {
      const member = upsertMember('discord', 'u1', 'Alice', null)
      updateNotes(member.id, 'Known contributor')

      const updated = getMemberById(member.id)!
      expect(updated.notes).toBe('Known contributor')
    })
  })

  describe('exportMembers', () => {
    it('exports CSV with headers', () => {
      upsertMember('discord', 'u1', 'Alice', null)
      upsertMember('discord', 'u2', 'Bob', null)

      const result = exportMembers({})
      expect(result.count).toBe(2)
      expect(result.csv).toContain('id,username,platform')
      expect(result.csv).toContain('Alice')
      expect(result.csv).toContain('Bob')
    })

    it('exports filtered members', () => {
      upsertMember('discord', 'u1', 'Alice', null)
      upsertMember('telegram', 'u2', 'Bob', null)

      const result = exportMembers({ platform: 'discord' })
      expect(result.count).toBe(1)
      expect(result.csv).toContain('Alice')
      expect(result.csv).not.toContain('Bob')
    })
  })
})
