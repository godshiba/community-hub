# Moderation Module

Member management, warnings, bans, notes, export.

## Files

| File | Purpose | Depends on |
|------|---------|------------|
| `src/shared/moderation-types.ts` | `MembersFilter`, `MembersPage`, `MemberDetail`, `WarnPayload`, `BanPayload`, `NotePayload` | settings-types (Platform) |
| `src/main/services/moderation.repository.ts` | Member queries with filtering/pagination, warnings, bans, notes, CSV export | database.service, moderation-types |
| `src/main/ipc/moderation.ts` | 8 handlers: getMembers, getMemberDetail, warn, ban, unban, updateNotes, syncMembers, exportMembers | moderation.repository, platform-manager |
| `src/renderer/stores/moderation.store.ts` | Zustand store — member list, filters, pagination, detail selection, warning/ban dialogs | moderation-types |
| `src/renderer/panels/moderation/ModerationPanel.tsx` | Root panel — search + filters + member table + detail split view | moderation.store |
| `src/renderer/panels/moderation/MemberTable.tsx` | Searchable, filterable member list with pagination | moderation.store |
| `src/renderer/panels/moderation/MemberDetailPanel.tsx` | Selected member profile, warning history, action log, notes | moderation.store |
| `src/renderer/panels/moderation/WarningDialog.tsx` | Issue warning modal — reason input, confirm | moderation.store |
| `src/renderer/panels/moderation/BanDialog.tsx` | Ban confirmation modal — reason, duration | moderation.store |
| `src/renderer/panels/moderation/BulkActionToolbar.tsx` | Bulk action toolbar — warn/ban/kick/export for selected members | moderation.store |
| `src/main/services/roles.repository.ts` | Role rules CRUD, role assignments, expiry queries | database.service, moderation-types |
| `src/main/services/roles.service.ts` | Role management logic — platform API calls, auto-assign on join | roles.repository, platform-manager, audit.repository |
| `src/main/ipc/roles.ts` | 8 handlers: getRules, saveRule, deleteRule, toggleRule, getRoles, getAssignments, assignRole, removeRole | roles.repository, roles.service |
| `src/main/tasks/role-expiry.ts` | Background task — checks for expired temp roles every 60s | roles.repository, platform-manager |
| `src/renderer/stores/roles.store.ts` | Zustand store — role rules, platform roles, assignments | moderation-types |
| `src/renderer/panels/settings/RoleManagementForm.tsx` | Role rules config — auto-assign, temp roles, active assignments | roles.store |

## Database Tables

| Table | Key columns |
|-------|-------------|
| `community_members` | id, username, platform, platform_user_id, join_date, status, reputation_score, warnings_count, notes, last_activity |
| `member_warnings` | id, member_id (FK), reason, given_by, given_at, resolved, resolved_at |
| `member_actions` | id, member_id (FK), action_type, reason, executed_by, executed_at |
| `role_rules` | id, platform, rule_type, role_id, role_name, duration_hours, enabled |
| `role_assignments` | id, member_id (FK), platform, role_id, role_name, assigned_at, expires_at, expired |

## Data Flow

```
ModerationPanel mounts
  -> moderation.store.fetchMembers()
  -> IPC 'moderation:getMembers' (with filters)
  -> moderation.repository.getMembers()
  -> SQLite query on community_members + joins
  -> MembersPage returned to store
  -> MemberTable renders list

User clicks member
  -> moderation.store.fetchMemberDetail(id)
  -> IPC 'moderation:getMemberDetail'
  -> moderation.repository.getMemberDetail(id)
  -> MemberDetail with warnings + actions returned
  -> MemberDetailPanel renders split view
```

## Change Map

| Operation | Files to touch |
|-----------|---------------|
| Add member field | `moderation-types.ts` + `moderation.repository.ts` + `MemberDetailPanel.tsx` |
| Add member action type | `moderation-types.ts` + `moderation.repository.ts` + new dialog component + `ModerationPanel.tsx` |
| Add filter option | `moderation-types.ts` (MembersFilter) + `moderation.repository.ts` (query) + `ModerationPanel.tsx` (UI) |
| Add new IPC channel | `ipc-types.ts` + `moderation-types.ts` + `src/main/ipc/moderation.ts` + `moderation.store.ts` |
| Add bulk action | `moderation.repository.ts` + `moderation-types.ts` + `MemberTable.tsx` (selection UI) + `moderation.store.ts` |
| Add moderation sub-panel | New `src/renderer/panels/moderation/<Name>.tsx` + import in `ModerationPanel.tsx` |
| New DB column on members | New migration SQL + `moderation.repository.ts` + `moderation-types.ts` |
