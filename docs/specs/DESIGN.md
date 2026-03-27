# Community Management Hub - Design Specification

**Status:** Approved
**Date:** 2026-03-28
**Platforms:** Discord, Telegram
**AI:** Optional autonomous agent (Grok, Claude, OpenAI, Gemini)

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Bundler | electron-vite | Purpose-built for Electron + Vite, fast HMR |
| Frontend | React 19 + TypeScript 5.7 strict | Latest stable, concurrent features |
| Styling | shadcn/ui + Tailwind CSS v4 | Component library + utility engine, glass theme via CSS vars |
| State | Zustand | Thin layer, DB is source of truth |
| Layout | IDE panel layout | Glassmorphism fits panels, no URL routing needed |
| Routing | Panel manager (Zustand) | Desktop app, no address bar, no URLs |
| IPC | Type-safe shared contract | Compile-time safety across process boundary |
| Design | Dark Obsidian glassmorphism | Minimalistic, professional, easy on eyes |
| Database | better-sqlite3, numbered migrations | Sync API, fast, no ORM overhead |
| Platforms | Discord + Telegram | Twitter/X dropped — API cost prohibitive |
| AI | Autonomous agent, 4 providers | Optional, profile-driven, runs communities |

---

## Panels (7)

1. **Dashboard** — stats, charts, community health overview
2. **Agent Terminal** — live AI agent feed, approvals, overrides
3. **Scheduler** — create/schedule posts for Discord + Telegram
4. **Moderation** — member management, warnings, bans
5. **Events** — create events, RSVPs, reminders
6. **Reports** — generate community health reports, PDF export
7. **Settings** — credentials, AI provider config, agent profile

---

## Sub-Specifications

| Spec | Scope | Link |
|------|-------|------|
| Tech Stack | Packages, versions, tooling | [tech-stack.md](tech-stack.md) |
| Architecture | Process boundary, data flow, folder structure | [architecture.md](architecture.md) |
| Design System | Glassmorphism tokens, colors, typography | [design-system.md](design-system.md) |
| IPC Bridge | Type-safe contract, preload, hooks | [ipc-bridge.md](ipc-bridge.md) |
| Database | Schema, migrations, tables | [database.md](database.md) |
| AI Agent | Profile, conversation engine, automation | [ai-agent.md](ai-agent.md) |
| Panel Layout | IDE layout, panel manager, icon bar | [panel-layout.md](panel-layout.md) |
| Modules | Per-module responsibilities | [modules.md](modules.md) |

---

## Quality Principles

- Many small files over few large files (200 lines typical, 400 max)
- One responsibility per file
- AI features are invisible when no provider configured
- Ship core, iterate based on real usage
- Type safety across process boundary — no string guessing
