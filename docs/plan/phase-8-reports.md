# Phase 8 — Community Health Reports

**Goal:** Generate comprehensive community reports with metrics, charts, and PDF export. Report history.

**Version range:** `v0.8.x`

**Depends on:** Phase 3 (analytics data), benefits from Phase 5 (member data) and Phase 7 (AI narrative)

---

## Tasks

### Store & IPC
- [x] `reports.store.ts` — report config, preview data, history, loading states
- [x] IPC channels: `reports:generate`, `reports:list`, `reports:get`, `reports:delete`, `reports:exportPDF`
- [x] Main handlers query across `platform_stats`, `community_members`, `events`, `agent_actions`

### Report Generator
- [x] `ReportGenerator.tsx` — config form: period selector, metric checkboxes (growth, engagement, retention, moderation, events)
- [x] Platform filter (Discord/Telegram/All)
- [x] Generate button

### Metrics Engine
- [x] `src/main/services/reports.repository.ts`
- [x] Growth rate: `(current - previous) / previous * 100`
- [x] Engagement rate: `active_users / total_users`
- [x] Retention rate: `(end_users - new_users) / start_users`
- [x] Churn rate: `1 - retention_rate`
- [x] Moderation summary: warnings, bans, resolved
- [x] Event summary: events held, total RSVPs, attendance rate

### Report Preview
- [x] `ReportPreview.tsx` — rendered report with sections:
  - Executive summary (key numbers)
  - Growth chart
  - Engagement breakdown
  - Platform comparison
  - Moderation activity
  - Event activity
  - (Optional, AI) Narrative insights and recommendations

### Report History
- [x] `ReportHistory.tsx` — list of previously generated reports
- [x] Click to view saved report
- [x] Delete old reports
- [x] Reports stored in `generated_reports` table (JSON blob of data)

### PDF Export
- [x] jsPDF for full report render
- [x] Styled PDF with sections for each metric category
- [x] Page breaks for long reports

### AI Integration (Optional)
- [x] If AI provider configured: narrative generation for report sections
- [x] Data-driven insights and recommendations via AI provider
- [x] Uses existing provider factory (Grok/Claude/OpenAI/Gemini)
- [x] Falls back to data-only report when no AI

## Acceptance Criteria

- Report generates with all selected metrics
- Preview renders with charts and tables
- PDF export produces clean, styled document
- Report history saves and loads correctly
- AI narrative adds value when available, report works without it
- Metrics calculate correctly against real data

## Tag

```bash
git tag v0.8.0  # report generator + preview
git tag v0.8.1  # PDF export + history
git tag v0.8.2  # AI narrative (optional)
```
