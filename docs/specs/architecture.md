# Architecture

## Process Boundary

```
Renderer (React)          Preload (bridge)         Main (Node.js)
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│ Panel Manager │ ◄─────► │ Typed IPC    │ ◄─────► │ IPC Handlers     │
│ Module Stores │         │ Bridge       │         │ Services         │
│ UI Components │         │              │         │ Background Tasks │
│               │         │              │         │ SQLite           │
└──────────────┘         └──────────────┘         └──────────────────┘
```

- Renderer never accesses Node.js APIs directly
- All data flows through the typed IPC bridge
- Main process owns database, platform APIs, and AI agent
- Preload exposes a minimal typed surface via contextBridge

## Data Flow (typical read)

1. Panel mounts → Zustand store calls `ipc.invoke(channel, payload)`
2. Preload forwards to main via `ipcRenderer.invoke`
3. IPC handler calls appropriate service
4. Service queries database or external API
5. Result returns through IPC → store updates → React re-renders

## Data Flow (agent action)

1. Platform SDK receives event (new message, new member)
2. Agent service evaluates automation rules
3. If rule matches → agent generates response via AI provider
4. Action logged to `agent_actions` table
5. If auto-approved → execute immediately
6. If needs review → queue for user approval, notify renderer

## Folder Structure

```
src/
├── shared/                          # shared types (no runtime code)
│   ├── ipc-channels.ts
│   ├── ipc-types.ts
│   └── types.ts
│
├── main/                            # Electron main process
│   ├── index.ts                     # app entry, window creation
│   ├── ipc/                         # IPC handler registrations
│   │   ├── analytics.ts
│   │   ├── scheduler.ts
│   │   ├── moderation.ts
│   │   ├── events.ts
│   │   ├── reports.ts
│   │   └── settings.ts
│   ├── services/                    # business logic
│   │   ├── database.service.ts
│   │   ├── discord.service.ts
│   │   ├── telegram.service.ts
│   │   └── aggregator.service.ts
│   ├── services/ai/                 # AI agent system
│   │   ├── agent.service.ts
│   │   ├── profile.service.ts
│   │   ├── conversation.service.ts
│   │   ├── automation.service.ts
│   │   ├── patterns.service.ts
│   │   ├── providers/
│   │   │   ├── base.provider.ts
│   │   │   ├── grok.provider.ts
│   │   │   ├── claude.provider.ts
│   │   │   ├── openai.provider.ts
│   │   │   └── gemini.provider.ts
│   │   └── prompts/
│   │       └── system.prompt.ts
│   ├── tasks/                       # background jobs
│   │   ├── stats-sync.ts
│   │   ├── post-sender.ts
│   │   ├── event-reminders.ts
│   │   └── member-sync.ts
│   └── utils/
│       ├── logger.ts
│       └── encryption.ts
│
├── preload/
│   └── index.ts                     # typed IPC bridge
│
└── renderer/
    ├── index.html
    ├── main.tsx
    ├── App.tsx                      # shell: title bar + icon bar + panels + status bar
    │
    ├── components/
    │   ├── layout/                  # app shell pieces
    │   │   ├── IconBar.tsx
    │   │   ├── PanelContainer.tsx
    │   │   ├── StatusBar.tsx
    │   │   └── TitleBar.tsx
    │   ├── glass/                   # glassmorphism primitives
    │   │   ├── GlassCard.tsx
    │   │   ├── GlassPanel.tsx
    │   │   └── GlassModal.tsx
    │   └── shared/                  # reusable across modules
    │       ├── StatsCard.tsx
    │       ├── PlatformBadge.tsx
    │       ├── DataTable.tsx
    │       └── ChartWrapper.tsx
    │
    ├── panels/                      # one dir per module
    │   ├── dashboard/
    │   ├── agent/
    │   ├── scheduler/
    │   ├── moderation/
    │   ├── events/
    │   ├── reports/
    │   └── settings/
    │
    ├── stores/                      # one store per module
    │   ├── panel.store.ts
    │   ├── analytics.store.ts
    │   ├── scheduler.store.ts
    │   ├── moderation.store.ts
    │   ├── events.store.ts
    │   └── reports.store.ts
    │
    ├── hooks/
    │   ├── useIpc.ts
    │   └── useAutoRefresh.ts
    │
    └── styles/
        ├── globals.css
        └── glass-theme.css
```

## Background Tasks

| Task | Interval | Purpose |
|------|----------|---------|
| stats-sync | 60 min | Fetch platform stats, persist to SQLite |
| post-sender | 30 sec | Check queue, send due posts |
| event-reminders | 60 sec | Send due reminders |
| member-sync | 6 hours | Sync member lists from APIs |

All tasks run in main process via `setInterval`, independent of renderer.
