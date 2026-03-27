# Phase 1 — Shell & Foundation

**Goal:** IDE-style layout renders with all structural components. IPC bridge works. Database initializes with migrations.

**Version range:** `v0.1.x`

**Depends on:** Phase 0

**Status:** Complete

---

## Tasks

### Glass Primitives
- [x] `GlassCard` component — surface/raised/overlay elevation variants
- [x] `GlassPanel` component — full-height panel wrapper
- [x] `GlassModal` component — overlay dialog with backdrop blur

### IDE Layout
- [x] `TitleBar` — custom frameless bar (32px), drag region, window controls (min/max/close)
- [x] `IconBar` — vertical strip (48px), 7 icons (Lucide), active state with accent border, tooltips
- [x] `PanelContainer` — renders active panel, supports split view with draggable divider
- [x] `StatusBar` — connection dots (left), agent status (center), last sync (right), 24px height
- [x] `App.tsx` — assembles TitleBar + IconBar + PanelContainer + StatusBar

### Panel System
- [x] `panel.store.ts` — Zustand store: activePanel, secondaryPanel, splitRatio, panelHistory
- [x] Panel registry mapping `PanelId -> ComponentType`
- [x] Keyboard shortcuts: `Cmd+1-7` switch panel, `Cmd+[` back, `Cmd+\` split, `Esc` close secondary
- [x] Placeholder panels for all 7 modules (title + description each)

### IPC Bridge
- [x] `src/shared/ipc-types.ts` — `IpcContract` type map with all channels, `IpcResult<T>` envelope
- [x] `src/preload/index.ts` — typed `invoke` function via `contextBridge`
- [x] `src/main/ipc/register-handler.ts` — handler registration with auto try-catch envelope
- [x] `src/renderer/hooks/useIpc.ts` — typed data fetching hook with auto-refresh
- [x] `app:ping` health-check channel registered

### Database
- [x] `src/main/services/database.service.ts` — init, run migrations, close, WAL mode
- [x] `src/main/migrations/001_initial.sql` — all 16 tables from spec
- [x] 5 indexes from spec
- [x] Migration runner: reads _migrations table, applies pending .sql files in order

### Electron Config
- [x] `frame: false` for custom title bar
- [x] `webPreferences.preload` pointing to preload script
- [x] `contextIsolation: true`, `nodeIntegration: false`

## Acceptance Criteria

- [x] TypeScript compiles clean (tsc --build: 0 errors)
- [x] Production build succeeds (electron-vite build)
- [x] 32 source files, all under 200 lines
- [ ] App launches with full IDE shell (manual test required)
- [ ] Clicking icons switches panels (manual test required)
- [ ] Database creates with all 16 tables (manual test required)

## Tag

```bash
git tag v0.1.0  # IDE shell + IPC + database
```
