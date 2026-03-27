# Phase 5 — Moderation Tools

**Goal:** Member management with search, warnings, bans, notes, and reputation. Split view for member detail.

**Version range:** `v0.5.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [ ] `moderation.store.ts` — members, filters, selected member, warnings, loading states
- [ ] IPC channels: `moderation:members`, `moderation:member-detail`, `moderation:warn`, `moderation:ban`, `moderation:unban`, `moderation:note`, `moderation:export`
- [ ] Main handlers querying `community_members`, `member_warnings`, `member_actions`

### Member Table
- [ ] `MemberTable.tsx` — sortable, paginated data table
- [ ] Columns: avatar, name, platform, status, reputation, join date, last active
- [ ] Filters: platform (Discord/Telegram/All), status (active/warned/banned), search by name
- [ ] Bulk actions: warn selected, ban selected
- [ ] Click row → opens member detail in secondary panel (split view)

### Member Detail
- [ ] `MemberDetail.tsx` — shown in secondary panel
- [ ] Profile info: name, platform, join date, last active, message count
- [ ] Reputation score with visual indicator
- [ ] Warning history list
- [ ] Action history (joins, leaves, bans, unbans)
- [ ] Notes section (add/edit notes)
- [ ] Quick actions: warn, ban/unban

### Warning System
- [ ] `WarningForm.tsx` — dialog: reason (text), severity (low/medium/high)
- [ ] Warnings stored in `member_warnings` table
- [ ] Warning count visible in member table
- [ ] Resolve warning action

### Ban System
- [ ] `BanDialog.tsx` — confirmation dialog with reason input
- [ ] Bans execute via platform API (kick/ban on Discord, restrict on Telegram)
- [ ] Unban action with confirmation
- [ ] Ban status synced to `community_members`

### Member Sync
- [ ] `src/main/tasks/member-sync.ts` — syncs members from both platforms every 6 hours
- [ ] Deduplicates across platforms
- [ ] Updates last_active, message_count, status

### Export
- [ ] CSV export of member list with current filters applied

## Acceptance Criteria

- Member table loads with real member data from platforms
- Filters and search work correctly
- Clicking a member opens split view with detail panel
- Warnings create and show in history
- Bans execute on the actual platform
- Member data stays fresh via background sync
- CSV export works with filtered data

## Tag

```bash
git tag v0.5.0  # member table + filters
git tag v0.5.1  # warnings + bans
git tag v0.5.2  # member sync + export
```
