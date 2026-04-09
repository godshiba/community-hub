# Enhancement Roadmap — v1.x

Post-v1.0 enhancements focused on scaling to large communities and deepening AI agent capabilities.

## Status

| Phase | Name | Version | Status |
|-------|------|---------|--------|
| UI | [UI/UX Upgrade](ui-upgrade.md) | v1.0.x | Complete |
| 1 | [Anti-Spam & Raid Protection](phase-1-anti-spam.md) | v1.1.0 | Complete |
| 2 | [Audit Log & Escalation](phase-2-audit-escalation.md) | v1.2.0 | Complete |
| 3 | [Bulk Moderation & Role Management](phase-3-bulk-roles.md) | v1.3.0 | Pending |
| 4 | [AI Content Moderation](phase-4-ai-moderation.md) | v1.4.0 | Pending |
| 5 | [Knowledge Base & Smart Agent](phase-5-knowledge-agent.md) | v1.5.0 | Pending |
| 6 | [Engagement & Gamification](phase-6-engagement.md) | v1.6.0 | Pending |
| 7 | [Agent Intelligence & Analytics](phase-7-agent-analytics.md) | v1.7.0 | Pending |

## Competitive Context

Full analysis: [competitive-analysis.md](competitive-analysis.md)

Prioritization driven by: what large-server admins (1k-100k+ members) need most, weighted by competitive gap severity.

**UI/UX upgrade** runs independently and should be done first — it establishes the shell and shared components that all feature phases will use.

## Version Scheme

```
v1.{phase}.{increment}
```

- **phase** -- matches the phase number (1-7)
- **increment** -- bumps within a phase as features land
- Each phase ends with a milestone tag: `v1.{phase}.0`

## Dependencies Between Phases

```
UI Upgrade (shell, shared components, glass polish) -- do first
  |
  +-- Phase 1 (anti-spam + raid protection)
  |     |-- Phase 2 (audit log + escalation -- builds on mod actions from Phase 1)
  |     |     |-- Phase 3 (bulk moderation + roles -- uses audit log)
  |     |-- Phase 6 (engagement/gamification -- independent after Phase 1)
  |
  +-- Phase 4 (AI content moderation -- independent, needs AI provider)
        |-- Phase 5 (knowledge base + smart agent -- extends AI layer)
              |-- Phase 7 (agent analytics -- needs data from Phase 5)
```

Phases 1 and 4 can be built in parallel. Phase 6 is independent of the AI track.

## How to Track Progress

1. Open the phase file for the current phase
2. Check off tasks as they're completed
3. Update the Status column in the table above
4. When a phase is done, tag and move to next

## Git Workflow

- **Branch:** `phase/v1-{n}-{name}` for active work
- **Merge:** squash-merge phase branches into `main`
- **Tag:** after each merge, tag on `main`
