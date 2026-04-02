import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, closeTestDatabase } from '../../test/db-helper'

let db: Database.Database

vi.mock('./database.service', () => ({
  getDatabase: () => db
}))

import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getEventDetail,
  getRSVPs,
  getDueReminders,
  markReminderSent,
  exportAttendees
} from './events.repository'

const basePayload = {
  title: 'Community Meetup',
  description: 'A fun event',
  eventDate: '2025-06-15T18:00:00.000Z',
  eventTime: '18:00',
  location: 'Discord Stage',
  platform: 'discord' as const,
  capacity: 50,
  status: 'upcoming' as const,
  reminders: []
}

describe('events.repository', () => {
  beforeEach(() => {
    db = createTestDatabase()
  })

  afterEach(() => {
    closeTestDatabase()
  })

  describe('createEvent', () => {
    it('creates an event with all fields', () => {
      const event = createEvent(basePayload)
      expect(event.id).toBeGreaterThan(0)
      expect(event.title).toBe('Community Meetup')
      expect(event.description).toBe('A fun event')
      expect(event.capacity).toBe(50)
      expect(event.platform).toBe('discord')
    })

    it('creates an event with reminders', () => {
      const event = createEvent({
        ...basePayload,
        reminders: [{ offset: '1h' }, { offset: '1d' }]
      })

      const detail = getEventDetail(event.id)
      expect(detail.reminders.length).toBe(2)
    })

    it('handles null optional fields', () => {
      const event = createEvent({
        ...basePayload,
        description: null,
        eventTime: null,
        location: null,
        platform: null,
        capacity: null
      })
      expect(event.description).toBeNull()
      expect(event.eventTime).toBeNull()
    })
  })

  describe('updateEvent', () => {
    it('updates event fields', () => {
      const event = createEvent(basePayload)
      const updated = updateEvent(event.id, {
        ...basePayload,
        title: 'Updated Meetup',
        capacity: 100
      })
      expect(updated.title).toBe('Updated Meetup')
      expect(updated.capacity).toBe(100)
    })

    it('replaces reminders on update', () => {
      const event = createEvent({
        ...basePayload,
        reminders: [{ offset: '1h' }]
      })

      updateEvent(event.id, {
        ...basePayload,
        reminders: [{ offset: '1d' }, { offset: 'custom', customMinutes: 30 }]
      })

      const detail = getEventDetail(event.id)
      expect(detail.reminders.length).toBe(2)
    })
  })

  describe('deleteEvent', () => {
    it('deletes an event', () => {
      const event = createEvent(basePayload)
      deleteEvent(event.id)
      expect(getEventById(event.id)).toBeUndefined()
    })
  })

  describe('getEvents', () => {
    beforeEach(() => {
      createEvent({ ...basePayload, title: 'Future Event', eventDate: '2099-01-01T00:00:00.000Z', status: 'upcoming' })
      createEvent({ ...basePayload, title: 'Past Event', eventDate: '2020-01-01T00:00:00.000Z', status: 'completed' })
      createEvent({ ...basePayload, title: 'Cancelled', eventDate: '2099-06-01T00:00:00.000Z', status: 'cancelled' })
    })

    it('returns all events without filter', () => {
      const events = getEvents({})
      expect(events.length).toBe(3)
    })

    it('filters upcoming events', () => {
      const events = getEvents({ status: 'upcoming' })
      expect(events.length).toBe(1)
      expect(events[0].title).toBe('Future Event')
    })

    it('filters by search term', () => {
      const events = getEvents({ search: 'Past' })
      expect(events.length).toBe(1)
      expect(events[0].title).toBe('Past Event')
    })

    it('filters by month', () => {
      const events = getEvents({ month: '2099-01' })
      expect(events.length).toBe(1)
    })
  })

  describe('getEventDetail', () => {
    it('returns event with rsvp counts', () => {
      const event = createEvent(basePayload)

      // Insert test RSVPs directly
      db.prepare(`
        INSERT INTO event_rsvps (event_id, user_id, username, platform, response)
        VALUES (?, ?, ?, ?, ?)
      `).run(event.id, 'u1', 'Alice', 'discord', 'yes')
      db.prepare(`
        INSERT INTO event_rsvps (event_id, user_id, username, platform, response)
        VALUES (?, ?, ?, ?, ?)
      `).run(event.id, 'u2', 'Bob', 'discord', 'maybe')

      const detail = getEventDetail(event.id)
      expect(detail.rsvpCounts.yes).toBe(1)
      expect(detail.rsvpCounts.maybe).toBe(1)
      expect(detail.rsvpCounts.no).toBe(0)
      expect(detail.rsvps.length).toBe(2)
    })

    it('throws for non-existent event', () => {
      expect(() => getEventDetail(999)).toThrow('Event 999 not found')
    })
  })

  describe('getDueReminders / markReminderSent', () => {
    it('returns unsent reminders past their time', () => {
      const event = createEvent({
        ...basePayload,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        reminders: [{ offset: 'custom', customMinutes: 99999 }]
      })

      const due = getDueReminders()
      expect(due.length).toBe(1)
      expect(due[0].eventTitle).toBe('Community Meetup')
    })

    it('marks reminder as sent', () => {
      createEvent({
        ...basePayload,
        eventDate: new Date(Date.now() + 86400000).toISOString(),
        reminders: [{ offset: 'custom', customMinutes: 99999 }]
      })

      const due = getDueReminders()
      markReminderSent(due[0].id)

      const afterMark = getDueReminders()
      expect(afterMark.length).toBe(0)
    })
  })

  describe('exportAttendees', () => {
    it('exports attendees as CSV', () => {
      const event = createEvent(basePayload)
      db.prepare(`
        INSERT INTO event_rsvps (event_id, user_id, username, platform, response)
        VALUES (?, ?, ?, ?, ?)
      `).run(event.id, 'u1', 'Alice', 'discord', 'yes')

      const result = exportAttendees(event.id)
      expect(result.count).toBe(1)
      expect(result.csv).toContain('id,event_id,user_id,username')
      expect(result.csv).toContain('Alice')
    })

    it('returns empty CSV for event with no attendees', () => {
      const event = createEvent(basePayload)
      const result = exportAttendees(event.id)
      expect(result.count).toBe(0)
    })
  })
})
