# Phase 6 — Event Manager

**Goal:** Create events, track RSVPs, send reminders, announce to platforms. Calendar and list views.

**Version range:** `v0.6.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [ ] `events.store.ts` — events, rsvps, selected event, filters, loading states
- [ ] IPC channels: `events:list`, `events:create`, `events:update`, `events:delete`, `events:rsvps`, `events:export`
- [ ] Main handlers for `events`, `event_rsvps`, `event_reminders` tables

### Events Panel
- [ ] `EventsPanel.tsx` — toggle between calendar view and list view

### Event Form
- [ ] `EventForm.tsx` — create/edit dialog: title, description, date, time, duration, platform(s), capacity
- [ ] Platform selector (announce on Discord, Telegram, or both)
- [ ] Recurring event option (weekly/monthly)

### Views
- [ ] `EventCalendar.tsx` — month grid with event dots, click day to see events
- [ ] `EventList.tsx` — filterable list: upcoming, past, cancelled
- [ ] `EventDetail.tsx` — shown in secondary panel (split view): full info + RSVP list

### RSVP Tracking
- [ ] `RSVPList.tsx` — attendee table: name, platform, status (yes/no/maybe), responded at
- [ ] RSVP counts on event cards
- [ ] Export attendees to CSV

### Announcements & Reminders
- [ ] Auto-announce event to selected platforms when created
- [ ] `src/main/tasks/event-reminders.ts` — checks every 60 seconds, sends reminders before event start
- [ ] Reminder config: 1 hour, 1 day, or custom before event
- [ ] Reminder messages sent via platform services

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
