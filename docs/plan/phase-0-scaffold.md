# Phase 0 — Project Scaffold

**Goal:** Working electron-vite project that launches an empty Electron window with React rendering.

**Version range:** `v0.0.x`

---

## Tasks

- [ ] `npm create @electron-vite` — initialize project
- [ ] Configure `electron.vite.config.ts` (main, preload, renderer entries)
- [ ] Set up `tsconfig.json` with strict mode, path aliases (`@shared/`, `@renderer/`, `@main/`)
- [ ] Install core deps: React 19, TypeScript 5.7, electron 33+
- [ ] Install dev deps: vitest, eslint, prettier
- [ ] Configure Tailwind CSS v4 with custom Dark Obsidian theme tokens
- [ ] Install and configure shadcn/ui (dark theme default)
- [ ] Create folder structure per `docs/specs/architecture.md`:
  - `src/main/` — main process entry
  - `src/main/services/` — empty, ready for services
  - `src/main/tasks/` — empty, ready for background tasks
  - `src/main/migrations/` — empty, ready for SQL
  - `src/preload/` — preload script with contextBridge stub
  - `src/renderer/` — React entry point
  - `src/renderer/components/` — empty
  - `src/renderer/panels/` — empty
  - `src/renderer/stores/` — empty
  - `src/renderer/hooks/` — empty
  - `src/shared/` — shared types
- [ ] Verify: `npm run dev` launches Electron window with React "Hello World"
- [ ] Verify: `npm run build` produces output
- [ ] Verify: `npm test` runs (even with zero tests)

## Acceptance Criteria

- Electron window opens with React content
- HMR works (edit renderer, see changes without restart)
- TypeScript strict mode compiles clean
- Tailwind classes render correctly
- Folder structure matches architecture spec

## Tag

```bash
git tag v0.0.1  # after scaffold
git tag v0.0.2  # after tailwind + shadcn configured
```
