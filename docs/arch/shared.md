# Shared — Types & IPC Contract

No runtime code. Only type definitions shared between main and renderer.

## Files

| File | Purpose |
|------|---------|
| `src/shared/types.ts` | `IpcResult<T>` envelope type used by all IPC responses |
| `src/shared/ipc-types.ts` | Master `IpcContract` — every IPC channel typed here. Single source of truth |
| `src/shared/settings-types.ts` | `Platform`, `AiConfig`, `AppPreferences`, `CredentialsState`, `PlatformStatus` |
| `src/shared/analytics-types.ts` | `StatsCard`, `GrowthPoint`, `HeatmapCell`, `AnalyticsData`, `StatsRequest` |
| `src/shared/scheduler-types.ts` | `PostPayload`, `ScheduledPost`, `SendResult`, `ChannelInfo`, `PostHistoryEntry` |
| `src/shared/moderation-types.ts` | `MembersFilter`, `MembersPage`, `MemberDetail`, `WarnPayload`, `BanPayload` |
| `src/shared/events-types.ts` | `EventPayload`, `CommunityEvent`, `EventDetail`, `EventRSVP`, `EventsFilter` |
| `src/shared/agent-types.ts` | `AgentStatus`, `AgentProfile`, `AgentPattern`, `AgentAutomation`, `AgentAction` |
| `src/shared/knowledge-types.ts` | `KnowledgeEntry`, `KnowledgeCategory`, `ChannelAgentConfig`, `KnowledgeSearchResult`, `KnowledgeImportResult` |
| `src/shared/reports-types.ts` | `ReportConfig`, `ReportData`, `SavedReport`, metric category types |

## Preload Bridge

| File | Purpose |
|------|---------|
| `src/preload/index.ts` | `contextBridge.exposeInMainWorld` — single typed `invoke()` function |

## Change Map

| Operation | Files to touch |
|-----------|---------------|
| Add new IPC channel | `src/shared/ipc-types.ts` (add to `IpcContract`) + relevant `*-types.ts` for payload/response types |
| Add new module types | New `src/shared/<module>-types.ts` + import in `ipc-types.ts` |
| Change IPC envelope | `src/shared/types.ts` (affects everything) |
