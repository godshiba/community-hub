# Phase 8 — Community Health Reports

**Goal:** Generate comprehensive community reports with metrics, charts, and PDF export. Report history.

**Version range:** `v0.8.x`

**Depends on:** Phase 3 (analytics data), benefits from Phase 5 (member data) and Phase 7 (AI narrative)

---

## Tasks

### Store & IPC
- [ ] `reports.store.ts` — report config, preview data, history, loading states
- [ ] IPC channels: `reports:generate`, `reports:list`, `reports:get`, `reports:delete`, `reports:export-pdf`
- [ ] Main handlers query across `platform_stats`, `community_members`, `events`, `agent_actions`

### Report Generator
- [ ] `ReportGenerator.tsx` — config form: period selector, metric checkboxes (growth, engagement, retention, churn, moderation, events)
- [ ] Platform filter (Discord/Telegram/All)
- [ ] Generate button

### Metrics Engine
- [ ] `src/main/services/reports.service.ts`
- [ ] Growth rate: `(current - previous) / previous * 100`
- [ ] Engagement rate: `active_users / total_users`
- [ ] Retention rate: `(end_users - new_users) / start_users`
- [ ] Churn rate: `1 - retention_rate`
- [ ] Moderation summary: warnings, bans, resolved
- [ ] Event summary: events held, total RSVPs, attendance rate

### Report Preview
- [ ] `ReportPreview.tsx` — rendered report with sections:
  - Executive summary (key numbers)
  - Growth chart
  - Engagement breakdown
  - Platform comparison
  - Moderation activity
  - Event activity
  - (Optional, AI) Narrative insights and recommendations

### Report History
- [ ] `ReportHistory.tsx` — list of previously generated reports
- [ ] Click to view saved report
- [ ] Delete old reports
- [ ] Reports stored in `generated_reports` table (JSON blob of data)

### PDF Export
- [ ] jsPDF + html2canvas for full report render
- [ ] Styled PDF matching app theme
- [ ] Charts included as images

### AI Integration (Optional)
- [ ] If AI provider configured: narrative generation for report sections
- [ ] Smart recommendations based on trends
- [ ] Trend explanations in plain language
- [ ] Falls back to data-only report when no AI

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
