# Phase 6 — Event Manager

**Goal:** Create events, track RSVPs, send reminders, announce to platforms. Calendar and list views.

**Version range:** `v0.6.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [x] `events.store.ts` — events, rsvps, selected event, filters, loading states
- [x] IPC channels: `events:create`, `events:getAll`, `events:getDetail`, `events:updateEvent`, `events:deleteEvent`, `events:getRSVPs`, `events:exportAttendees`
- [x] Main handlers for `events`, `event_rsvps`, `event_reminders` tables
- [x] `events-types.ts` — shared type definitions for events, RSVPs, reminders
- [x] `events.repository.ts` — full CRUD with row-to-domain mappers

### Events Panel
- [x] `EventsPanel.tsx` — toggle between calendar view and list view

### Event Form
- [x] `EventForm.tsx` — create/edit dialog: title, description, date, time, platform, capacity, status
- [x] Platform selector (announce on Discord, Telegram, or both)
- [ ] Recurring event option (weekly/monthly) — deferred to polish phase

### Views
- [x] `EventCalendar.tsx` — month grid with event dots, click day to see events
- [x] `EventList.tsx` — filterable list: upcoming, past, cancelled, all
- [x] `EventDetail.tsx` — shown in secondary panel (split view): full info + RSVP list

### RSVP Tracking
- [x] RSVP list in `EventDetail.tsx` — attendee table: name, platform, status (yes/no/maybe), responded at
- [x] RSVP counts on event detail view
- [x] Export attendees to CSV

### Announcements & Reminders
- [x] Auto-announce event to selected platforms when created
- [x] `src/main/tasks/event-reminders.ts` — checks every 60 seconds, sends reminders before event start
- [x] Reminder config: 1 hour, 1 day, or custom before event
- [x] Reminder messages sent via platform services

## Acceptance Criteria

- Event creation form saves to DB
- Calendar shows events on correct dates
- List view filters work (upcoming/past/cancelled)
- Event detail opens in split view with RSVP list
- Announcements post to Discord and Telegram
- Reminders fire at configured time
- CSV export of attendees works

## Tag

```bash
git tag v0.6.0  # event form + calendar + list
git tag v0.6.1  # RSVP tracking + detail view
git tag v0.6.2  # announcements + reminders
```
