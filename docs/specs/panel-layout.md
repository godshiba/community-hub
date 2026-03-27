# Panel Layout — IDE Style

## Layout Structure

```
+----------------------------------------------------------+
|  TitleBar (custom frameless, 32px)                        |
+------+---------------------------------------------------+
|      |                                                    |
| Icon |  PanelContainer                                    |
| Bar  |  +---------------------+------------------------+  |
|      |  | Primary Panel       | Secondary Panel        |  |
| 48px |  |                     | (optional, resizable)  |  |
|      |  |                     |                         |  |
|      |  |                     |                         |  |
|      |  +---------------------+------------------------+  |
|      |                                                    |
+------+---------------------------------------------------+
|  StatusBar (24px)                                         |
+----------------------------------------------------------+
```

## Components

### TitleBar (`components/layout/TitleBar.tsx`)
- Custom frameless title bar (Electron `frame: false`)
- App name on left
- Window controls on right (minimize, maximize, close)
- Draggable region for window movement
- Height: 32px

### IconBar (`components/layout/IconBar.tsx`)
- Vertical strip, left side
- Width: 48px
- Icons for each panel (Lucide icons):
  - LayoutDashboard → Dashboard
  - Bot → Agent Terminal
  - Calendar → Scheduler
  - Shield → Moderation
  - CalendarDays → Events
  - FileBarChart → Reports
  - Settings → Settings (bottom-aligned)
- Active icon: accent background + left border indicator
- Hover: glass opacity shift
- Tooltip on hover showing panel name

### PanelContainer (`components/layout/PanelContainer.tsx`)
- Renders active panel(s)
- Supports single panel or split view
- Split: draggable divider between primary and secondary
- Split ratio stored in panel store
- Smooth transitions when switching panels

### StatusBar (`components/layout/StatusBar.tsx`)
- Height: 24px
- Left: platform connection indicators (colored dots)
- Center: agent status (running / paused / disabled)
- Right: last sync time

## Panel Store

```typescript
interface PanelState {
  activePanel: PanelId
  secondaryPanel: PanelId | null
  splitRatio: number          // 0.0 to 1.0, default 0.6
  panelHistory: PanelId[]     // for back-navigation

  setActivePanel: (id: PanelId) => void
  openSecondary: (id: PanelId) => void
  closeSecondary: () => void
  setSplitRatio: (ratio: number) => void
  goBack: () => void
}

type PanelId =
  | 'dashboard'
  | 'agent'
  | 'scheduler'
  | 'moderation'
  | 'events'
  | 'reports'
  | 'settings'
```

## Panel Registry

Each module exports a panel component:

```typescript
const PANEL_REGISTRY: Record<PanelId, ComponentType> = {
  dashboard: DashboardPanel,
  agent: AgentPanel,
  scheduler: SchedulerPanel,
  moderation: ModerationPanel,
  events: EventsPanel,
  reports: ReportsPanel,
  settings: SettingsPanel,
}
```

PanelContainer looks up the active panel in the registry and renders it.

## Split View Use Cases

- Moderation: member list (primary) + member detail (secondary)
- Events: event list (primary) + event detail (secondary)
- Agent: action feed (primary) + conversation thread (secondary)
- Reports: report list (primary) + report preview (secondary)

## Keyboard Shortcuts

- `Cmd/Ctrl + 1-7` — switch to panel by position
- `Cmd/Ctrl + [` — go back in panel history
- `Cmd/Ctrl + \` — toggle split view
- `Escape` — close secondary panel
