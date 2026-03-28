# Phase 3 — Analytics Dashboard

**Goal:** Dashboard panel shows live community stats, charts, and top contributors from connected platforms.

**Version range:** `v0.3.x`

**Depends on:** Phase 2

---

## Tasks

### Store & IPC
- [x] `analytics.store.ts` — stats, growth data, heatmap data, contributors, period, loading states
- [x] IPC channels: `analytics:getStats`, `analytics:syncNow`, `analytics:exportStats`
- [x] Main handlers query `platform_stats` table + live API data

### Dashboard Panel
- [x] `DashboardPanel.tsx` — layout with period selector (day/week/month), auto-refresh toggle
- [x] 4 stats cards: Total Members, Growth Rate, Active Users, Engagement Rate
- [x] Each card shows value + trend indicator (up/down + percentage)

### Charts
- [x] `GrowthChart.tsx` — Recharts line chart, Discord (#5865F2) + Telegram (#26A5E4) lines, time axis
- [x] `ActivityHeatmap.tsx` — hours x days grid, intensity-based coloring
- [x] `PlatformComparison.tsx` — bar chart comparing Discord vs Telegram metrics
- [x] `TopContributors.tsx` — data table: rank, avatar, name, platform, messages, score

### Background Sync
- [x] `src/main/tasks/stats-sync.ts` — fetches stats from platforms every 60 minutes, writes to `platform_stats`
- [x] Auto-refresh in renderer every 30 seconds (re-fetch from DB, not API)

### Export
- [x] CSV export via papaparse
- [x] PDF export via jsPDF (stats + charts snapshot)

## Acceptance Criteria

- [x] Dashboard shows real data from connected platforms
- [x] Charts render with platform-colored lines
- [x] Period selector changes all displayed data
- [x] Auto-refresh updates without flicker
- [x] Export produces valid CSV and PDF files
- [x] Loading states show while data is fetching

## Tag

```bash
git tag v0.3.0  # full dashboard: stats cards, charts, heatmap, export, background sync
```
