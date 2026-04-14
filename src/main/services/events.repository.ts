import { getDatabase } from './database.service'
import type {
  CommunityEvent,
  EventDetail,
  EventPayload,
  EventRSVP,
  EventReminder,
  EventsFilter,
  EventStatus,
  RSVPCounts,
  ExportAttendeesResult,
  ReminderConfig
} from '@shared/events-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface EventRow {
  id: number
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  location: string | null
  platform: string | null
  capacity: number | null
  status: string
  created_at: string
  updated_at: string
}

interface RSVPRow {
  id: number
  event_id: number
  user_id: string
  username: string
  platform: string
  response: string
  responded_at: string
}

interface ReminderRow {
  id: number
  event_id: number
  reminder_time: string
  sent: number
  sent_at: string | null
}

// ---------------------------------------------------------------------------
// Row to domain mappers
// ---------------------------------------------------------------------------

function rowToEvent(row: EventRow): CommunityEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    eventTime: row.event_time,
    location: row.location,
    platform: row.platform as Platform | null,
    capacity: row.capacity,
    status: row.status as EventStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToRSVP(row: RSVPRow): EventRSVP {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    username: row.username,
    platform: row.platform as Platform,
    response: row.response as EventRSVP['response'],
    respondedAt: row.responded_at
  }
}

function rowToReminder(row: ReminderRow): EventReminder {
  return {
    id: row.id,
    eventId: row.event_id,
    reminderTime: row.reminder_time,
    sent: row.sent === 1,
    sentAt: row.sent_at
  }
}

// ---------------------------------------------------------------------------
// Events CRUD
// ---------------------------------------------------------------------------

export function createEvent(payload: EventPayload): CommunityEvent {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO events (title, description, event_date, event_time, location, platform, capacity, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    payload.title,
    payload.description,
    payload.eventDate,
    payload.eventTime,
    payload.location,
    payload.platform,
    payload.capacity,
    payload.status
  )

  const event = getEventById(Number(result.lastInsertRowid))!

  if (payload.reminders.length > 0) {
    insertReminders(event.id, event.eventDate, payload.reminders)
  }

  return event
}

export function updateEvent(id: number, payload: EventPayload): CommunityEvent {
  const db = getDatabase()
  db.prepare(`
    UPDATE events
    SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?,
        platform = ?, capacity = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    payload.title,
    payload.description,
    payload.eventDate,
    payload.eventTime,
    payload.location,
    payload.platform,
    payload.capacity,
    payload.status,
    id
  )

  // Replace reminders
  db.prepare('DELETE FROM event_reminders WHERE event_id = ?').run(id)
  if (payload.reminders.length > 0) {
    insertReminders(id, payload.eventDate, payload.reminders)
  }

  const updated = getEventById(id)
  if (!updated) throw new Error(`Event ${id} not found after update`)
  return updated
}

export function deleteEvent(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM events WHERE id = ?').run(id)
}

export function getEventById(id: number): CommunityEvent | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as EventRow | undefined
  return row ? rowToEvent(row) : undefined
}

export function getEvents(filter: EventsFilter): readonly CommunityEvent[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter.status === 'upcoming') {
    conditions.push("event_date >= date('now')")
    conditions.push("status NOT IN ('cancelled', 'completed')")
  } else if (filter.status === 'past') {
    conditions.push("(event_date < datetime('now') OR status IN ('completed', 'cancelled'))")
  } else if (filter.status) {
    conditions.push('status = ?')
    params.push(filter.status)
  }

  if (filter.search) {
    conditions.push('(title LIKE ? OR description LIKE ?)')
    params.push(`%${filter.search}%`, `%${filter.search}%`)
  }

  if (filter.month) {
    conditions.push("strftime('%Y-%m', event_date) = ?")
    params.push(filter.month)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db.prepare(
    `SELECT * FROM events ${where} ORDER BY event_date ASC`
  ).all(...params) as EventRow[]

  return rows.map(rowToEvent)
}

// ---------------------------------------------------------------------------
// Event detail
// ---------------------------------------------------------------------------

export function getEventDetail(id: number): EventDetail {
  const event = getEventById(id)
  if (!event) throw new Error(`Event ${id} not found`)

  const rsvps = getRSVPs(id)
  const reminders = getReminders(id)
  const rsvpCounts = countRSVPs(id)

  return { event, rsvps, reminders, rsvpCounts }
}

// ---------------------------------------------------------------------------
// RSVPs
// ---------------------------------------------------------------------------

export function getRSVPs(eventId: number): readonly EventRSVP[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM event_rsvps WHERE event_id = ? ORDER BY responded_at DESC'
  ).all(eventId) as RSVPRow[]
  return rows.map(rowToRSVP)
}

function countRSVPs(eventId: number): RSVPCounts {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN response = 'yes' THEN 1 ELSE 0 END), 0) as yes,
      COALESCE(SUM(CASE WHEN response = 'no' THEN 1 ELSE 0 END), 0) as no,
      COALESCE(SUM(CASE WHEN response = 'maybe' THEN 1 ELSE 0 END), 0) as maybe
    FROM event_rsvps WHERE event_id = ?
  `).get(eventId) as { yes: number; no: number; maybe: number }

  return { yes: row.yes, no: row.no, maybe: row.maybe }
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

function getReminders(eventId: number): readonly EventReminder[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM event_reminders WHERE event_id = ? ORDER BY reminder_time ASC'
  ).all(eventId) as ReminderRow[]
  return rows.map(rowToReminder)
}

function insertReminders(eventId: number, eventDate: string, configs: readonly ReminderConfig[]): void {
  const db = getDatabase()
  const stmt = db.prepare(
    'INSERT INTO event_reminders (event_id, reminder_time) VALUES (?, ?)'
  )

  for (const config of configs) {
    const reminderTime = computeReminderTime(eventDate, config)
    stmt.run(eventId, reminderTime)
  }
}

function computeReminderTime(eventDate: string, config: ReminderConfig): string {
  const date = new Date(eventDate)
  switch (config.offset) {
    case '1h':
      date.setHours(date.getHours() - 1)
      break
    case '1d':
      date.setDate(date.getDate() - 1)
      break
    case 'custom':
      date.setMinutes(date.getMinutes() - (config.customMinutes ?? 60))
      break
  }
  return date.toISOString()
}

/** Get unsent reminders that are due */
export function getDueReminders(): readonly (EventReminder & { eventTitle: string; eventPlatform: string | null })[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT r.*, e.title as event_title, e.platform as event_platform
    FROM event_reminders r
    JOIN events e ON r.event_id = e.id
    WHERE r.sent = 0 AND r.reminder_time <= datetime('now')
      AND e.status NOT IN ('cancelled', 'completed')
  `).all() as (ReminderRow & { event_title: string; event_platform: string | null })[]

  return rows.map((row) => ({
    ...rowToReminder(row),
    eventTitle: row.event_title,
    eventPlatform: row.event_platform
  }))
}

export function markReminderSent(id: number): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE event_reminders SET sent = 1, sent_at = datetime('now') WHERE id = ?"
  ).run(id)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Escape a value for RFC 4180 CSV (prevents CSV injection) */
function csvField(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || /^[=+\-@\t\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportAttendees(eventId: number): ExportAttendeesResult {
  const rsvps = getRSVPs(eventId)
  const header = 'id,event_id,user_id,username,platform,response,responded_at'
  const lines = rsvps.map((r) =>
    [r.id, r.eventId, csvField(r.userId), csvField(r.username), r.platform, r.response, r.respondedAt].join(',')
  )

  return {
    csv: [header, ...lines].join('\n'),
    count: rsvps.length
  }
}
