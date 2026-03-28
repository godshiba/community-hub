# Phase 4 — Multi-Platform Scheduler

**Goal:** Create, schedule, and auto-send posts to Discord and Telegram. Queue management with edit/cancel.

**Version range:** `v0.4.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [x] `scheduler.store.ts` — drafts, queue, history, loading states
- [x] IPC channels: `scheduler:createPost`, `scheduler:updatePost`, `scheduler:getQueue`, `scheduler:getHistory`, `scheduler:cancelPost`, `scheduler:sendNow`, `scheduler:getChannels`
- [x] Main handlers for CRUD on `scheduled_posts` + `post_history` tables
- [x] Typed `scheduler-types.ts` — PostPayload, ScheduledPost, PostHistoryEntry, ChannelInfo, SendResult

### Platform Services
- [x] `PlatformService.listChannels()` — returns available channels/chats
- [x] `PlatformService.sendMessage()` — sends text to a channel/chat
- [x] Discord: lists text channels from cached guilds, sends via discord.js
- [x] Telegram: lists tracked chats, sends via Telegraf bot.telegram.sendMessage

### Scheduler Panel
- [x] `SchedulerPanel.tsx` — editor on top, queue/history tabs on bottom

### Post Editor
- [x] `PostEditor.tsx` — textarea with character count
- [x] Platform toggle buttons (Discord, Telegram)
- [x] Channel/chat selector per platform (populated from IPC)
- [x] DateTime picker for scheduling
- [x] Save Draft / Schedule / Send Now buttons

### Queue & History
- [x] `PostQueue.tsx` — pending posts table: title, platforms, scheduled time, status, actions (send now/cancel)
- [x] `PostHistory.tsx` — sent history: post ID, platform, success/fail, error text, sent time
- [x] Cancel resets to draft with null scheduled_time

### Background Sender
- [x] `src/main/tasks/post-sender.ts` — checks every 30 seconds for posts due to send
- [x] Sends to each selected platform via service
- [x] Updates status in `scheduled_posts` and creates `post_history` entry
- [x] Handles partial failure (one platform fails, other succeeds)

## Acceptance Criteria

- [x] Posts save as drafts or schedule for future
- [x] Queue shows all pending posts with status
- [x] Auto-sender fires at correct time (30s check interval)
- [x] Post appears in Discord and/or Telegram
- [x] History shows send results with status per platform
- [x] Cancel works on scheduled posts
- [x] Send Now sends immediately and updates history

## Tag

```bash
git tag v0.4.0  # full scheduler: editor + queue + sender
```
