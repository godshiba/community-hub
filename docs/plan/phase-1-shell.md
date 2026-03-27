# Phase 1 — Shell & Foundation

**Goal:** IDE-style layout renders with all structural components. IPC bridge works. Database initializes with migrations.

**Version range:** `v0.1.x`

**Depends on:** Phase 0

---

## Tasks

### Glass Primitives
- [ ] `GlassCard` component — surface/raised/overlay elevation variants
- [ ] `GlassPanel` component — full-height panel wrapper
- [ ] `GlassModal` component — overlay dialog with backdrop blur

### IDE Layout
- [ ] `TitleBar` — custom frameless bar (32px), drag region, window controls (min/max/close)
- [ ] `IconBar` — vertical strip (48px), 7 icons (Lucide), active state with accent border, tooltips
- [ ] `PanelContainer` — renders active panel, supports split view with draggable divider
- [ ] `StatusBar` — connection dots (left), agent status (center), last sync (right), 24px height
- [ ] `App.tsx` — assembles TitleBar + IconBar + PanelContainer + StatusBar

### Panel System
- [ ] `panel.store.ts` — Zustand store: activePanel, secondaryPanel, splitRatio, panelHistory
- [ ] Panel registry mapping `PanelId → ComponentType`
- [ ] Keyboard shortcuts: `Cmd+1-7` switch panel, `Cmd+[` back, `Cmd+\` split, `Esc` close secondary
- [ ] Placeholder panels for all 7 modules (just a title + "Coming soon" each)

### IPC Bridge
- [ ] `src/shared/ipc-types.ts` — `IpcContract` type map, `IpcResult<T>` envelope
- [ ] `src/preload/index.ts` — typed `invoke` function via `contextBridge`
- [ ] `src/main/ipc/register-handler.ts` — handler registration with auto try-catch envelope
- [ ] `src/renderer/hooks/useIpc.ts` — typed data fetching hook
- [ ] Verify: renderer can invoke a test channel and get typed response

### Database
- [ ] `src/main/services/database.service.ts` — init, run migrations, close
- [ ] `src/main/migrations/001-init.sql` — all 16 tables from `docs/specs/database.md`
- [ ] Indexes from spec
- [ ] Verify: DB file created at `~/.community-hub/data.db` on first launch
- [ ] Verify: migrations run on startup, idempotent

### Electron Config
- [ ] `frame: false` for custom title bar
- [ ] `webPreferences.preload` pointing to preload script
- [ ] `contextIsolation: true`, `nodeIntegration: false`

## Acceptance Criteria

- App launches with full IDE shell (title bar, icon bar, panel area, status bar)
- Clicking icons switches panels
- Split view works with draggable divider
- IPC round-trip works (renderer → main → renderer)
- Database creates with all 16 tables
- Glass components render with correct blur/opacity

## Tag

```bash
git tag v0.1.0  # IDE shell renders
git tag v0.1.1  # IPC bridge working
git tag v0.1.2  # database + migrations
```
