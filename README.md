# Community Hub

macOS desktop app for managing Discord and Telegram communities with an optional autonomous AI agent.

Dark Obsidian glassmorphism IDE-style interface built on Electron + React.

---

## Features

| Panel | Description |
|-------|-------------|
| Dashboard | Real-time stats, growth charts, activity heatmap, platform comparison |
| AI Agent | Autonomous community management — replies, welcomes, moderation, escalation |
| Scheduler | Compose and schedule posts to Discord channels and Telegram chats |
| Moderation | Member table, warnings, bans, reputation scores, audit log |
| Events | Create events, manage RSVPs, send reminders |
| Reports | Community health metrics, PDF and CSV export |
| Settings | Platform credentials, AI provider, preferences |

---

## Requirements

- macOS 13 Ventura or later (primary target)
- Node.js 22+ (for development)
- Discord bot token and/or Telegram bot token
- At least one AI provider API key (optional — AI panel is hidden when unconfigured)

---

## Installation

### Download (recommended)

Download the latest `.dmg` from [Releases](https://github.com/godshiba/community-hub/releases), open it, and drag Community Hub to Applications.

### Build from source

```bash
git clone https://github.com/godshiba/community-hub.git
cd community-hub
npm install
cp .env.example .env   # fill in your tokens
npm run dev
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values you need.

### Discord

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Create a new application → Bot → copy the token
3. Enable **Message Content Intent** under Privileged Gateway Intents
4. Invite the bot to your server with scopes: `bot`, permissions: `Read Messages`, `Send Messages`, `Moderate Members`, `Ban Members`

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
OWNER_DISCORD_ID=your_discord_user_id
```

### Telegram

1. Message [@BotFather](https://t.me/botfather) → `/newbot`
2. Copy the token it gives you
3. Add the bot to your group as an administrator

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
OWNER_TELEGRAM_ID=your_telegram_user_id
```

### AI Providers (optional)

Configure at least one to enable the AI Agent panel. All others are ignored.

```env
# xAI Grok
XAI_API_KEY=xai-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Google Gemini
GOOGLE_AI_API_KEY=AIza...
```

Select the active provider and model in **Settings → AI Provider** inside the app.

---

## Development

```bash
npm run dev          # start with hot reload
npm test             # run unit tests
npm run typecheck    # TypeScript check
npm run build        # production build (no package)
```

### Project Structure

```
src/
  main/       — Electron main process (SQLite, platform APIs, AI agent, background tasks)
  renderer/   — React UI (panels, stores, components)
  preload/    — IPC bridge (contextBridge expose)
  shared/     — Type definitions shared between processes
docs/
  arch/       — Per-module architecture docs
  specs/      — Design specs (DB schema, IPC contract, design system)
  plan/       — Phase roadmap and release plan
```

### Architecture

Two Electron processes communicate through a type-safe IPC bridge:

- **Main process** owns all business logic: SQLite database, Discord/Telegram bots, AI agent, background sync tasks
- **Renderer process** is pure React UI with no Node.js access — all data goes through `window.api.invoke(channel, args)`
- **Preload** exposes a single `invoke()` function via `contextBridge`
- **Shared** holds TypeScript types only — the `IpcContract` type map is the source of truth for all channels

See [docs/arch/README.md](docs/arch/README.md) for detailed per-module docs.

---

## Packaging

```bash
npm run dist            # build + package for current arch
npm run dist:universal  # universal binary (x64 + arm64)
npm run dist:arm64      # Apple Silicon only
npm run dist:x64        # Intel only
```

Output goes to `dist/`. Requires `build/icon.icns` — see [build/README.md](build/README.md) for instructions.

---

## Tech Stack

- [Electron 33](https://electronjs.org) + [electron-vite](https://electron-vite.org)
- [React 19](https://react.dev) + [TypeScript 5.7 strict](https://typescriptlang.org)
- [Zustand](https://zustand-demo.pmnd.rs) (state management)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (local SQLite)
- [Tailwind CSS v4](https://tailwindcss.com) + custom glassmorphism design system
- [discord.js v14](https://discord.js.org) + [Telegraf](https://telegraf.js.org)
- [Recharts](https://recharts.org) (charts)
- [jsPDF](https://parall.ax/products/jspdf) + [PapaParse](https://papaparse.com) (PDF/CSV export)
- AI: Grok (xAI), Claude (Anthropic), OpenAI, Gemini behind a unified `AiProvider` interface

---

## License

ISC
