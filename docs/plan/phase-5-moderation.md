# Phase 5 — Moderation Tools

**Goal:** Member management with search, warnings, bans, notes, and reputation. Split view for member detail.

**Version range:** `v0.5.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [x] `moderation.store.ts` — members, filters, selected member, warnings, loading states
- [x] IPC channels: `moderation:getMembers`, `moderation:getMemberDetail`, `moderation:warnUser`, `moderation:banUser`, `moderation:unbanUser`, `moderation:updateNotes`, `moderation:syncMembers`, `moderation:exportMembers`
- [x] Main handlers querying `community_members`, `member_warnings`, `member_actions`
- [x] Shared types in `src/shared/moderation-types.ts`
- [x] Moderation repository in `src/main/services/moderation.repository.ts`

### Member Table
- [x] `MemberTable.tsx` — sortable, paginated data table
- [x] Columns: name, platform, status, reputation, warnings count
- [x] Filters: platform (Discord/Telegram/All), status (active/warned/banned/left), search by name
- [x] Click row opens member detail in side panel (split view)

### Member Detail
- [x] `MemberDetailPanel.tsx` — shown in right half of panel
- [x] Profile info: name, platform, platform user ID, join date, last active
- [x] Reputation score display
- [x] Warning history list
- [x] Action history (warns, bans, unbans, notes)
- [x] Notes section (add/edit notes)
- [x] Quick actions: warn, ban/unban

### Warning System
- [x] `WarningDialog.tsx` — dialog with reason input
- [x] Warnings stored in `member_warnings` table
- [x] Warning count visible in member table and detail
- [x] Action logged in `member_actions`

### Ban System
- [x] `BanDialog.tsx` — confirmation dialog with reason input
- [x] Bans execute via platform API (ban on Discord, banChatMember on Telegram)
- [x] Unban action in detail panel
- [x] Ban status synced to `community_members`

### Member Sync
- [x] `src/main/tasks/member-sync.ts` — syncs members from both platforms every 6 hours
- [x] Initial sync 30s after startup
- [x] Upserts to avoid duplicates (unique index on platform + platform_user_id)
- [x] Migration `004_members_unique.sql` for unique constraint

### Event Wiring
- [x] Discord: GuildMemberAdd, GuildMemberRemove, GuildBanAdd wired to moderation repository
- [x] Telegram: chat_member event wired to moderation repository (join/leave/kick)

### Export
- [x] CSV export of member list with current filters applied

## Acceptance Criteria

- [x] Member table loads with real member data from platforms
- [x] Filters and search work correctly
- [x] Clicking a member opens split view with detail panel
- [x] Warnings create and show in history
- [x] Bans execute on the actual platform
- [x] Member data stays fresh via background sync
- [x] CSV export works with filtered data
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run build` exits 0

## Tag

```bash
git tag v0.5.0  # full moderation module
```
