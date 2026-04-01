import type { Platform } from './settings-types'

export type EventStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'

export type RSVPResponse = 'yes' | 'no' | 'maybe'

export type ReminderOffset = '1h' | '1d' | 'custom'

export interface CommunityEvent {
  readonly id: number
  readonly title: string
  readonly description: string | null
  readonly eventDate: string        // ISO date-time
  readonly eventTime: string | null  // HH:mm
  readonly location: string | null
  readonly platform: Platform | null
  readonly capacity: number | null
  readonly status: EventStatus
  readonly createdAt: string
  readonly updatedAt: string
}

export interface EventPayload {
  readonly title: string
  readonly description: string | null
  readonly eventDate: string
  readonly eventTime: string | null
  readonly location: string | null
  readonly platform: Platform | null
  readonly capacity: number | null
  readonly status: EventStatus
  readonly announce: boolean
  readonly channelIds: Record<Platform, string>
  readonly reminders: readonly ReminderConfig[]
}

export interface ReminderConfig {
  readonly offset: ReminderOffset
  readonly customMinutes?: number  // only when offset === 'custom'
}

export interface EventRSVP {
  readonly id: number
  readonly eventId: number
  readonly userId: string
  readonly username: string
  readonly platform: Platform
  readonly response: RSVPResponse
  readonly respondedAt: string
}

export interface EventReminder {
  readonly id: number
  readonly eventId: number
  readonly reminderTime: string
  readonly sent: boolean
  readonly sentAt: string | null
}

export interface EventDetail {
  readonly event: CommunityEvent
  readonly rsvps: readonly EventRSVP[]
  readonly reminders: readonly EventReminder[]
  readonly rsvpCounts: RSVPCounts
}

export interface RSVPCounts {
  readonly yes: number
  readonly no: number
  readonly maybe: number
}

export interface EventsFilter {
  readonly status?: EventStatus | 'upcoming' | 'past'
  readonly search?: string
  readonly month?: string  // YYYY-MM for calendar view
}

export interface ExportAttendeesResult {
  readonly csv: string
  readonly count: number
}
