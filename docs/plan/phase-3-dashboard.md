# Phase 3 — Analytics Dashboard

**Goal:** Dashboard panel shows live community stats, charts, and top contributors from connected platforms.

**Version range:** `v0.3.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [ ] `analytics.store.ts` — stats, growth data, heatmap data, contributors, period, loading states
- [ ] IPC channels: `analytics:stats`, `analytics:growth`, `analytics:heatmap`, `analytics:contributors`, `analytics:export`
- [ ] Main handlers query `platform_stats` table + live API data

### Dashboard Panel
- [ ] `DashboardPanel.tsx` — layout with period selector (day/week/month/custom), auto-refresh toggle
- [ ] 4 stats cards: Total Members, Growth Rate, Active Users, Engagement Rate
- [ ] Each card shows value + trend indicator (up/down + percentage)

### Charts
- [ ] `GrowthChart.tsx` — Recharts line chart, Discord (#5865F2) + Telegram (#26A5E4) lines, time axis
- [ ] `ActivityHeatmap.tsx` — hours x days grid, intensity-based coloring
- [ ] `PlatformComparison.tsx` — bar chart comparing Discord vs Telegram metrics
- [ ] `TopContributors.tsx` — data table: rank, avatar, name, platform, messages, score

### Background Sync
- [ ] `src/main/tasks/stats-sync.ts` — fetches stats from platforms every 60 minutes, writes to `platform_stats`
- [ ] Auto-refresh in renderer every 30 seconds (re-fetch from DB, not API)

### Export
- [ ] CSV export via papaparse
- [ ] PDF export via jsPDF (stats + charts snapshot)

## Acceptance Criteria

- Dashboard shows real data from connected platforms
- Charts render with platform-colored lines
- Period selector changes all displayed data
- Auto-refresh updates without flicker
- Export produces valid CSV and PDF files
- Loading states show while data is fetching

## Tag

```bash
git tag v0.3.0  # stats cards + growth chart
git tag v0.3.1  # heatmap + comparison + contributors
git tag v0.3.2  # export + background sync
```
