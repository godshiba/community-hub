import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

import {
  createPost,
  updatePost,
  getPost,
  getQueue,
  getHistory,
  cancelPost,
  deletePost,
  markSending,
  markSent,
  insertHistory,
  getDuePosts
} from './scheduler.repository'

describe('scheduler.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('createPost', () => {
    it('creates a draft post without scheduled time', () => {
      const post = createPost({
        title: 'Test Post',
        content: 'Hello world',
        platforms: ['discord'],
        channelIds: { discord: 'ch-1' },
        scheduledTime: null
      })

      expect(post.id).toBeGreaterThan(0)
      expect(post.title).toBe('Test Post')
      expect(post.content).toBe('Hello world')
      expect(post.status).toBe('draft')
      expect(post.platforms).toEqual(['discord'])
    })

    it('creates a scheduled post with scheduled time', () => {
      const time = new Date(Date.now() + 60000).toISOString()
      const post = createPost({
        title: 'Future Post',
        content: 'Scheduled content',
        platforms: ['discord', 'telegram'],
        channelIds: {},
        scheduledTime: time
      })

      expect(post.status).toBe('scheduled')
      expect(post.scheduledTime).toBe(time)
    })
  })

  describe('updatePost', () => {
    it('updates a draft post', () => {
      const post = createPost({
        title: 'Original',
        content: 'Body',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: null
      })

      const updated = updatePost(post.id, {
        title: 'Updated',
        content: 'New Body',
        platforms: ['telegram'],
        channelIds: {},
        scheduledTime: null
      })

      expect(updated.title).toBe('Updated')
      expect(updated.content).toBe('New Body')
      expect(updated.platforms).toEqual(['telegram'])
    })

    it('throws for non-existent post', () => {
      expect(() =>
        updatePost(999, {
          title: 'X',
          content: 'X',
          platforms: ['discord'],
          channelIds: {},
          scheduledTime: null
        })
      ).toThrow('Post 999 not found')
    })
  })

  describe('getPost', () => {
    it('returns undefined for non-existent id', () => {
      expect(getPost(999)).toBeUndefined()
    })

    it('returns the post by id', () => {
      const created = createPost({
        title: 'Find Me',
        content: 'Body',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: null
      })
      const found = getPost(created.id)
      expect(found).toBeDefined()
      expect(found!.title).toBe('Find Me')
    })
  })

  describe('getQueue', () => {
    it('returns draft and scheduled posts', () => {
      createPost({ title: 'A', content: 'a', platforms: ['discord'], channelIds: {}, scheduledTime: null })
      createPost({
        title: 'B',
        content: 'b',
        platforms: ['telegram'],
        channelIds: {},
        scheduledTime: new Date(Date.now() + 60000).toISOString()
      })

      const queue = getQueue()
      expect(queue.length).toBe(2)
    })
  })

  describe('cancelPost', () => {
    it('cancels a scheduled post back to draft', () => {
      const time = new Date(Date.now() + 60000).toISOString()
      const post = createPost({
        title: 'Cancel Me',
        content: 'Body',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: time
      })

      cancelPost(post.id)
      const updated = getPost(post.id)
      expect(updated!.status).toBe('draft')
      expect(updated!.scheduledTime).toBeNull()
    })

    it('throws for already-sent post', () => {
      const time = new Date(Date.now() + 60000).toISOString()
      const post = createPost({
        title: 'X',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: time
      })
      markSending(post.id)
      markSent(post.id, true)

      expect(() => cancelPost(post.id)).toThrow()
    })
  })

  describe('deletePost', () => {
    it('deletes a post', () => {
      const post = createPost({
        title: 'Delete',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: null
      })
      deletePost(post.id)
      expect(getPost(post.id)).toBeUndefined()
    })
  })

  describe('markSending / markSent', () => {
    it('transitions scheduled -> sending -> sent', () => {
      const time = new Date(Date.now() + 60000).toISOString()
      const post = createPost({
        title: 'Flow',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: time
      })

      expect(markSending(post.id)).toBe(true)
      expect(getPost(post.id)!.status).toBe('sending')

      markSent(post.id, true)
      expect(getPost(post.id)!.status).toBe('sent')
    })

    it('marks error on failed send', () => {
      const time = new Date(Date.now() + 60000).toISOString()
      const post = createPost({
        title: 'Fail',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: time
      })
      markSending(post.id)
      markSent(post.id, false, 'Network error')

      const updated = getPost(post.id)
      expect(updated!.status).toBe('error')
      expect(updated!.errorMessage).toBe('Network error')
    })

    it('returns false when marking non-scheduled post as sending', () => {
      const post = createPost({
        title: 'Draft',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: null
      })
      expect(markSending(post.id)).toBe(false)
    })
  })

  describe('insertHistory / getHistory', () => {
    it('records and retrieves send history', () => {
      const post = createPost({
        title: 'Hist',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: null
      })

      insertHistory(post.id, 'discord', 'msg-123', true, null)
      insertHistory(post.id, 'telegram', null, false, 'Bot not connected')

      const history = getHistory()
      expect(history.length).toBe(2)
      expect(history.find((h) => h.platform === 'discord')!.success).toBe(true)
      expect(history.find((h) => h.platform === 'telegram')!.success).toBe(false)
    })
  })

  describe('getDuePosts', () => {
    it('returns posts past their scheduled time', () => {
      // Insert directly using SQL datetime to avoid timezone issues with datetime('now')
      db.prepare(`
        INSERT INTO scheduled_posts (title, content, platforms, scheduled_time, status)
        VALUES (?, ?, ?, datetime('now', '-1 hour'), ?)
      `).run('Due', 'Body', '["discord"]', 'scheduled')

      const due = getDuePosts()
      expect(due.length).toBe(1)
      expect(due[0].title).toBe('Due')
    })

    it('does not return future posts', () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString()
      createPost({
        title: 'Future',
        content: 'X',
        platforms: ['discord'],
        channelIds: {},
        scheduledTime: futureTime
      })

      const due = getDuePosts()
      expect(due.length).toBe(0)
    })
  })
})
