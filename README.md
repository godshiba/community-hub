# Community Management Hub

Desktop application for managing communities across Discord and Telegram with an optional AI agent that operates autonomously on your behalf.

## Tech Stack

- Electron + Vite + React 19 + TypeScript (strict)
- SQLite (better-sqlite3, local storage)
- Discord.js, node-telegram-bot-api
- Zustand (state management)
- shadcn/ui + Tailwind CSS v4 (Dark Obsidian glassmorphism)
- AI providers: Grok, Claude, OpenAI, Gemini (all optional)

## Status

In Development

## Features

- [ ] Analytics Dashboard — stats, charts, platform comparison
- [ ] AI Agent Terminal — autonomous community management
- [ ] Multi-Platform Scheduler — post to Discord + Telegram
- [ ] Moderation Tools — members, warnings, bans
- [ ] Event Manager — events, RSVPs, reminders
- [ ] Community Health Reports — metrics, PDF export

## Design

Minimalistic IDE-style layout with glassmorphism. Dark-first, frosted glass panels, monospace data display.

## Documentation

All specs live in [docs/specs/](docs/specs/):

| File | Contents |
|------|----------|
| [DESIGN.md](docs/specs/DESIGN.md) | Hub document — decisions + links to all sub-specs |
| [tech-stack.md](docs/specs/tech-stack.md) | Packages, versions, tooling |
| [architecture.md](docs/specs/architecture.md) | Process boundary, data flow, folder structure |
| [design-system.md](docs/specs/design-system.md) | Glassmorphism tokens, colors, typography |
| [ipc-bridge.md](docs/specs/ipc-bridge.md) | Type-safe IPC contract |
| [database.md](docs/specs/database.md) | Schema, migrations, 16 tables |
| [ai-agent.md](docs/specs/ai-agent.md) | Agent system, profile, automation |
| [panel-layout.md](docs/specs/panel-layout.md) | IDE layout, panel manager |
| [modules.md](docs/specs/modules.md) | Per-module responsibilities |

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
