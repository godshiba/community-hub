# Phase 3 — Bulk Moderation & Role Management

**Goal:** Handle mass operations (bulk warn, ban, export) and manage roles (auto-assign, reaction roles, temp roles). Essential for servers >5k members.

**Version range:** `v1.3.x`

**Depends on:** Phase 2 (bulk actions log to audit trail)

---

## Tasks

### 3.0 — Types & Migration

- [x] Extend `src/shared/moderation-types.ts` — `BulkActionPayload`, `BulkActionResult`, `RoleRule`, `RoleAssignment`
- [x] Extend `src/shared/ipc-types.ts` — `moderation:bulkWarn`, `moderation:bulkBan`, `moderation:bulkKick`, `roles:getRules`, `roles:saveRule`, `roles:getRoles`, etc.
- [x] Migration `009_roles.sql` — `role_rules` + `role_assignments` tables

### 3.1 — Bulk Moderation

- [x] `src/main/ipc/moderation.ts` — add bulk handlers
  - `moderation:bulkWarn` — warn multiple members with same reason
  - `moderation:bulkBan` — ban multiple members (with platform API calls)
  - `moderation:bulkKick` — kick multiple members
  - Per-member error handling with partial success results
- [x] Rate limiting for platform API calls (300ms delay between calls)
- [x] All bulk actions create individual audit log entries per affected member
- [x] Progress reporting for large batches (return partial results)

### 3.2 — Bulk UI

- [x] Extend `MemberTable.tsx` — checkbox selection column
  - Select all (current page / all matching filter)
  - Selection count indicator
- [x] `src/renderer/panels/moderation/BulkActionToolbar.tsx` — appears when members selected
  - Bulk warn, bulk ban, bulk kick buttons
  - Confirmation dialog with member count and reason input
  - Result dialog showing succeeded/failed counts
- [x] Export selected members to CSV

### 3.3 — Role Management Service

- [x] `src/main/services/roles.service.ts` — role management logic
  - Fetch roles from Discord API (guild roles) and Telegram (admin rights)
  - Auto-assign role on join (configurable per platform)
  - Temp roles: assign role with expiry, background task removes when expired
- [x] `src/main/services/roles.repository.ts` — role rules CRUD
- [x] `src/main/tasks/role-expiry.ts` — background task checks for expired temp roles (every 60s)

### 3.4 — Role IPC & Store

- [x] `src/main/ipc/roles.ts` — `registerRoleHandlers()` for role config and platform role fetching
- [x] Register in `src/main/index.ts`
- [x] `src/renderer/stores/roles.store.ts` — role rules, available roles

### 3.5 — Role Management UI

- [x] `src/renderer/panels/settings/RoleManagementForm.tsx` — configure role rules
  - Auto-assign on join: select role per platform
  - Temp roles: assign role with duration (hours/days)
  - View active temp roles with expiry countdown

### 3.6 — Member Detail Enhancement

- [x] Show member roles in `MemberDetailPanel.tsx`
- [x] Quick action: assign/remove role from detail view

## Acceptance Criteria

- Bulk warn/ban/kick works for 10-1000 selected members
- Rate limits respected (no API bans)
- All bulk actions logged individually in audit trail
- Auto-assign role on join works for both platforms
- Temp roles auto-expire via background task
- Selection UI is responsive and clear
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

## Tag

```bash
git tag v1.3.0  # bulk moderation + role management
```
