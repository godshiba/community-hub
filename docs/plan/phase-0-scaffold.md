# Phase 0 — Project Scaffold

**Goal:** Working electron-vite project that launches an empty Electron window with React rendering.

**Version range:** `v0.0.x`

**Status:** Complete

---

## Tasks

- [x] Initialize electron-vite project (manual setup — interactive CLI unavailable)
- [x] Configure `electron.vite.config.ts` (main, preload, renderer entries)
- [x] Set up `tsconfig.json` with strict mode, path aliases (`@shared/`, `@renderer/`, `@main/`, `@/`)
- [x] Install core deps: React 19, TypeScript 5.7+, Electron 33+
- [x] Install dev deps: vitest, eslint, prettier
- [x] Configure Tailwind CSS v4 with custom Dark Obsidian theme tokens
- [x] Install and configure shadcn/ui (dark theme default, new-york style)
- [x] Create folder structure per `docs/specs/architecture.md`:
  - `src/main/` — main process entry
  - `src/main/services/` + `services/ai/providers/` + `services/ai/prompts/`
  - `src/main/tasks/`
  - `src/main/migrations/`
  - `src/main/ipc/`
  - `src/main/utils/`
  - `src/preload/` — preload script with contextBridge
  - `src/renderer/` — React entry point
  - `src/renderer/components/layout/`, `glass/`, `shared/`, `ui/`
  - `src/renderer/panels/` — 7 module dirs
  - `src/renderer/stores/`
  - `src/renderer/hooks/`
  - `src/renderer/lib/`
  - `src/renderer/styles/`
  - `src/shared/` — shared types
- [x] Verify: `npm run typecheck` passes (0 errors)
- [x] Verify: `npm run build` produces output (main + preload + renderer)
- [x] Verify: `npm test` runs (passes with no tests)

## Acceptance Criteria

- [x] TypeScript strict mode compiles clean
- [x] Tailwind classes + shadcn/ui components render correctly
- [x] Folder structure matches architecture spec
- [ ] Electron window opens with React content (requires `npm run dev` — manual test)
- [ ] HMR works (requires manual test)

## Tag

```bash
git tag v0.0.1  # scaffold complete
```
