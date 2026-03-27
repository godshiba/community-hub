# Phase 4 — Multi-Platform Scheduler

**Goal:** Create, schedule, and auto-send posts to Discord and Telegram. Queue management with edit/cancel.

**Version range:** `v0.4.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [ ] `scheduler.store.ts` — drafts, queue, history, loading states
- [ ] IPC channels: `scheduler:create`, `scheduler:update`, `scheduler:delete`, `scheduler:list-queue`, `scheduler:list-history`, `scheduler:send-now`
- [ ] Main handlers for CRUD on `scheduled_posts` + `post_history` tables

### Scheduler Panel
- [ ] `SchedulerPanel.tsx` — split layout: editor on top, queue/history tabs on bottom

### Post Editor
- [ ] `PostEditor.tsx` — TipTap rich text editor
- [ ] Media upload with drag-and-drop (store files locally in `~/.community-hub/media/`)
- [ ] Character count + platform-specific limits display
- [ ] Preview mode (shows how it will look on each platform)

### Platform & Scheduling
- [ ] `PlatformSelector.tsx` — toggle checkboxes for Discord, Telegram
- [ ] DateTime picker for scheduling (or "Send Now" button)
- [ ] Channel/chat selector per platform

### Queue & History
- [ ] `PostQueue.tsx` — pending posts table: title, platforms, scheduled time, status, actions (edit/cancel/send now)
- [ ] `PostHistory.tsx` — sent posts table: title, platforms, sent time, status (success/partial/failed)
- [ ] Inline edit for drafts and scheduled posts
- [ ] Cancel scheduled posts

### Background Sender
- [ ] `src/main/tasks/post-sender.ts` — checks every 30 seconds for posts due to send
- [ ] Sends to each selected platform via aggregator
- [ ] Updates status in `scheduled_posts` and creates `post_history` entry
- [ ] Handles partial failure (one platform fails, other succeeds)

## Acceptance Criteria

- Rich text editor works with formatting and media
- Posts save as drafts or schedule for future
- Queue shows all pending posts
- Auto-sender fires at correct time
- Post appears in both Discord and Telegram
- History shows send results with status per platform
- Edit and cancel work on scheduled posts

## Tag

```bash
git tag v0.4.0  # editor + queue UI
git tag v0.4.1  # background sender
git tag v0.4.2  # edit, cancel, send-now
```
