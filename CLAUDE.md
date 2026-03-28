# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Community Management Hub — a **macOS-native** Electron desktop app for managing Discord and Telegram communities with an optional autonomous AI agent. Dark Obsidian glassmorphism IDE-style interface.

### macOS Native

This is a macOS app. All UI must match macOS conventions:
- **Window chrome:** `titleBarStyle: 'hiddenInset'` with native traffic lights (no custom close/minimize/maximize buttons)
- **Keyboard shortcuts:** Use `Cmd` (not `Ctrl`) — `metaKey` in event handlers
- **Typography:** Use system font stack (`-apple-system, BlinkMacSystemFont`)
- **Behaviors:** Respect macOS patterns — app stays alive on window close (`platform !== 'darwin'` check), `activate` event re-creates window

## Tech Stack

- **Runtime:** Electron 33+ with electron-vite
- **Frontend:** React 19, TypeScript 5.7 (strict), Zustand
- **UI:** shadcn/ui + Tailwind CSS v4, custom glassmorphism theme
- **Database:** better-sqlite3 (local SQLite at `~/.community-hub/data.db`)
- **Platform SDKs:** discord.js v14, node-telegram-bot-api
- **AI (optional):** Grok, Claude, OpenAI, Gemini — all behind a provider-agnostic interface
- **Charts:** Recharts. **Rich text:** TipTap. **Export:** jsPDF, papaparse

## Commands

```bash
npm run dev          # start electron-vite dev server with HMR
npm run build        # production build
npm run preview      # preview production build locally
npm test             # run vitest
npm test -- --run    # run tests once (no watch)
```

## Architecture

### Process Boundary

Two Electron processes communicate via a **type-safe IPC bridge**:

- **Main process** (`src/main/`) — owns SQLite, platform APIs, AI agent, background tasks. All business logic lives here.
- **Renderer process** (`src/renderer/`) — React UI only. Never accesses Node.js APIs directly.
- **Preload** (`src/preload/index.ts`) — exposes a single typed `invoke` function via `contextBridge`.
- **Shared** (`src/shared/`) — type definitions only (no runtime code). `ipc-types.ts` is the single source of truth for all IPC channel contracts.

### IPC Pattern

All channels defined in `src/shared/ipc-types.ts` as a `IpcContract` type map. Every response uses the `IpcResult<T>` envelope (`{ success, data }` or `{ success, error }`). The renderer hook `useIpc` provides typed data fetching. Main process handlers are registered via `registerHandler` which auto-wraps in try-catch and returns the envelope.

### No Router

There is no URL routing. The app uses an IDE-style panel layout managed by Zustand (`stores/panel.store.ts`). The `IconBar` toggles panels, `PanelContainer` renders them. Panels support split view (primary + secondary).

### State Management

Zustand stores are thin — the database is the source of truth. One store per module: `analytics`, `scheduler`, `moderation`, `events`, `reports`, plus `panel` for layout state.

### AI Agent System

Located in `src/main/services/ai/`. The agent has a profile (personality/tone/knowledge), a conversation engine, and an automation rule engine. All AI features are **invisible** when no provider is configured — components return `null`, not disabled states. Four providers normalize to one interface: `complete(system, user) → string`.

### Background Tasks

`src/main/tasks/` — stats sync (60min), post sender (30s), event reminders (60s), member sync (6h). All run as `setInterval` in main process.

## Specifications

All design decisions and technical specs are in `docs/specs/`:

- `DESIGN.md` — hub document linking all sub-specs, full decision log
- `architecture.md` — folder structure, data flow diagrams
- `design-system.md` — glassmorphism CSS tokens, colors, typography
- `ipc-bridge.md` — full IPC contract with all channels typed
- `database.md` — 16-table schema with SQL, migration strategy
- `ai-agent.md` — agent profile, conversation engine, automation rules
- `panel-layout.md` — IDE layout, panel manager, keyboard shortcuts
- `modules.md` — per-module responsibilities and sub-components
- `tech-stack.md` — every dependency with version targets

**Read `docs/specs/DESIGN.md` first** — it links to everything else.

## Code Conventions

- **File size:** 200 lines typical, 400 max. Split before it grows.
- **One responsibility per file.** If a file does two things, split it.
- **Panels, not pages.** UI modules live in `src/renderer/panels/<module>/`.
- **Glass primitives:** Use `GlassCard`, `GlassPanel`, `GlassModal` from `components/glass/` — don't inline glassmorphism styles.
- **IPC contract first:** When adding a new IPC channel, define types in `src/shared/ipc-types.ts` before writing the handler or the UI.
- **AI features gate:** Wrap in availability check that returns `null` when no provider is configured.

## Database

SQLite with sequential numbered migrations in `src/main/migrations/`. The `database.service.ts` runs pending migrations on startup. Schema details in `docs/specs/database.md`.

## Release Plan

The full roadmap lives in `docs/plan/`:

- `ROADMAP.md` — master status table, version scheme, dependency graph
- `phase-{0-9}-*.md` — one file per phase with task checklists and acceptance criteria

**Current target:** v1.0.0 across 10 phases (0-9).

### Version & Tag Rules

```
v0.{phase}.{increment}    — development builds
v1.0.0-rc.{n}             — release candidates
v1.0.0                    — stable release
```

- Tag on `main` after each meaningful deliverable.
- Push tags: `git push origin main --tags`
- Never skip a phase number — phases are sequential milestones.

### Git Workflow

- **Branch naming:** `phase/{n}-{name}` (e.g., `phase/0-scaffold`, `phase/1-shell`)
- **Work on phase branch**, squash-merge into `main` when phase completes.
- **Tag on `main`** after merge.
- **Commit format:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`
- **One feature per commit.** Don't bundle unrelated changes.

### Progress Tracking

When working on a phase:

1. Open `docs/plan/phase-{n}-*.md` for the current phase
2. Check off tasks (`- [x]`) as they're completed
3. Update the Status column in `docs/plan/ROADMAP.md`
4. Tag when acceptance criteria are met

### Phase Execution Rules

When working on any phase:

1. **Create TodoWrite tasks** for every step before writing code
2. **Work step by step** — complete and verify one task before starting the next
3. **Check after every step** — run the validation commands below
4. **Update the phase file** — check off tasks (`- [x]`) as they're completed
5. **Report to user** — before declaring a phase done, run all checks and share results

### Validation Commands

Run these after every meaningful change to keep the codebase clean:

```bash
npx tsc --noEmit                    # type check (zero errors)
npm run lint 2>/dev/null || true    # lint if configured
npm test -- --run 2>/dev/null       # run tests if any exist
npm run build 2>/dev/null || true   # verify build succeeds
```

**Phase gate:** A phase is NOT complete until:
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0
- `npm run dev` launches without errors
- All acceptance criteria from the phase file are met

### Session Continuity

Each session may only cover part of a phase. To resume:

1. Read `docs/plan/ROADMAP.md` to find the current phase
2. Read that phase file to see which tasks remain
3. Continue from the first unchecked task
