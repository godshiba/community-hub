# Release Roadmap — v1.0.0

## Status

| Phase | Name | Version | Status |
|-------|------|---------|--------|
| 0 | [Project Scaffold](phase-0-scaffold.md) | v0.0.1 | Complete |
| 1 | [Shell & Foundation](phase-1-shell.md) | v0.1.0 | Complete |
| 2 | [Settings & Platforms](phase-2-settings.md) | v0.2.0 | Complete |
| 3 | [Dashboard](phase-3-dashboard.md) | v0.3.0 | Complete |
| 4 | [Scheduler](phase-4-scheduler.md) | v0.4.x | Not Started |
| 5 | [Moderation](phase-5-moderation.md) | v0.5.x | Not Started |
| 6 | [Events](phase-6-events.md) | v0.6.x | Not Started |
| 7 | [AI Agent](phase-7-agent.md) | v0.7.x | Not Started |
| 8 | [Reports](phase-8-reports.md) | v0.8.x | Not Started |
| 9 | [Polish & Release](phase-9-release.md) | v0.9.x → v1.0.0 | Not Started |

## Version Scheme

```
v0.{phase}.{increment}
```

- **phase** — matches the phase number (0-9)
- **increment** — bumps within a phase as features land
- **v1.0.0** — all phases complete, tested, release-ready

Each phase ends with a milestone tag: `v0.{phase}.0` for first deliverable, increments for additions within that phase.

## Tag Format

```
v0.0.1   — scaffold init
v0.1.0   — IDE shell renders
v0.1.1   — database + migrations
v0.2.0   — settings panel + credentials
v0.2.1   — Discord service
v0.2.2   — Telegram service
...
v0.9.0   — all features complete, testing
v1.0.0-rc.1 — release candidate
v1.0.0   — stable release
```

## Git Workflow

- **Branch:** `main` for stable, `phase/{n}-{name}` for active work
- **Merge:** squash-merge phase branches into `main`
- **Tag:** after each merge, tag on `main`
- **Push:** `git push origin main --tags` after each tag

## How to Track Progress

1. Open the phase file for the current phase
2. Check off tasks as they're completed
3. Update the Status column in the table above
4. When a phase is done, tag and move to next

## Dependencies Between Phases

```
Phase 0 (scaffold)
  └─ Phase 1 (shell + DB + IPC)
       ├─ Phase 2 (settings + platform services)
       │    ├─ Phase 3 (dashboard — needs platform data)
       │    ├─ Phase 4 (scheduler — needs platform send)
       │    ├─ Phase 5 (moderation — needs member data)
       │    └─ Phase 6 (events — needs platform announce)
       └─ Phase 7 (AI agent — needs IPC + DB, independent of platforms)
            └─ Phase 8 (reports — benefits from all data sources)
                 └─ Phase 9 (polish + release)
```

Phases 3-6 can be built in any order after Phase 2. Phase 7 can start after Phase 1.
