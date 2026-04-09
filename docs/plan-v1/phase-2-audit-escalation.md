# Phase 2 — Audit Log & Warning Escalation

**Goal:** Full moderation audit trail and automatic escalation chains. Every moderation action is logged, searchable, and exportable. Warnings auto-escalate through configurable punishment tiers.

**Version range:** `v1.2.x`

**Depends on:** Phase 1 (spam actions feed into audit log)

---

## Tasks

### 2.0 — Types & Migration

- [x] Extend `src/shared/moderation-types.ts` — `AuditLogEntry`, `EscalationChain`, `EscalationStep`, `AuditFilter`
- [x] Add IPC channels: `moderation:getAuditLog`, `moderation:getEscalationConfig`, `moderation:updateEscalationConfig`
- [x] Migration `007_audit_escalation.sql` — `moderation_audit_log` table, `escalation_chains` table, `escalation_steps` table

### 2.1 — Audit Log System

- [x] `src/main/services/audit.repository.ts` — CRUD for audit log
  - Log every moderation action: warn, mute, kick, ban, unban, note, spam detection, raid action
  - Fields: timestamp, moderator (human or AI agent), target member, action type, reason, platform, metadata
  - Queryable by: date range, action type, moderator, target, platform
- [x] Auto-log from existing moderation handlers (warn, ban, unban)
- [x] Auto-log from spam engine actions (Phase 1)
- [x] Auto-log from AI agent moderation actions

### 2.2 — Warning Escalation Engine

- [x] `src/main/services/escalation.engine.ts` — configurable escalation chains
  - Default chain: 1st warn -> warning, 2nd warn -> 1h mute, 3rd warn -> 24h mute, 4th warn -> kick, 5th warn -> ban
  - Customizable: admins define their own chains
  - Time-decay: warnings can expire after N days (configurable)
  - Per-platform chains (different rules for Discord vs Telegram)
- [x] Integrate with existing `moderation:warnUser` handler — after warn, check escalation
- [x] Execute escalation action automatically via platform services

### 2.3 — IPC & Store

- [x] `src/main/ipc/audit.ts` — `registerAuditHandlers()` for log queries + escalation config
- [x] Register in `src/main/index.ts`
- [x] Extend `src/renderer/stores/moderation.store.ts` — audit log state, escalation config

### 2.4 — Audit Log UI

- [x] `src/renderer/panels/moderation/AuditLogPanel.tsx` — full audit log view
  - Filterable table: date, action, moderator, target, platform
  - Search by member name or reason text
  - Color-coded action types (warn=yellow, ban=red, unban=green)
  - Export to CSV
- [x] Add "Audit Log" tab to `ModerationPanel.tsx`
- [x] Show recent actions in `MemberDetailPanel.tsx` (per-member audit history)

### 2.5 — Escalation Config UI

- [x] `src/renderer/panels/settings/EscalationConfigForm.tsx` — configure escalation chains
  - Visual step builder: add/remove/reorder steps
  - Per-step: threshold (warning count), action (mute/kick/ban), duration (for timed actions)
  - Warning expiry setting
  - Per-platform toggle

## Acceptance Criteria

- Every moderation action (manual, spam engine, AI agent) creates an audit log entry
- Audit log is searchable, filterable, and exportable
- Warning escalation auto-executes configured action at each threshold
- Escalation chains are configurable per platform
- Warning expiry works (old warnings decay)
- Audit entries visible in member detail view
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

## Tag

```bash
git tag v1.2.0  # audit log + escalation chains
```
