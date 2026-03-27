# Type-Safe IPC Bridge

## Shared Contract

All IPC channels defined in `src/shared/ipc-types.ts`:

```typescript
type IpcContract = {
  // Analytics
  'analytics:getStats': { request: StatsRequest; response: GlobalStats }
  'analytics:syncNow': { request: void; response: SyncResult }
  'analytics:exportStats': { request: ExportRequest; response: ExportResult }

  // Scheduler
  'scheduler:createPost': { request: CreatePostPayload; response: { id: number } }
  'scheduler:getQueue': { request: void; response: readonly ScheduledPost[] }
  'scheduler:editPost': { request: EditPostPayload; response: void }
  'scheduler:cancelPost': { request: { id: number }; response: void }
  'scheduler:sendNow': { request: { id: number }; response: SendResult }

  // Moderation
  'moderation:getMembers': { request: MemberFilters; response: readonly Member[] }
  'moderation:getMemberDetail': { request: { id: number }; response: MemberDetail }
  'moderation:warnUser': { request: WarnPayload; response: void }
  'moderation:banUser': { request: BanPayload; response: void }
  'moderation:unbanUser': { request: { id: number }; response: void }
  'moderation:exportMembers': { request: ExportRequest; response: ExportResult }

  // Events
  'events:create': { request: CreateEventPayload; response: { id: number } }
  'events:getAll': { request: EventFilters; response: readonly Event[] }
  'events:getDetail': { request: { id: number }; response: EventDetail }
  'events:updateEvent': { request: UpdateEventPayload; response: void }
  'events:deleteEvent': { request: { id: number }; response: void }
  'events:getRSVPs': { request: { eventId: number }; response: readonly RSVP[] }
  'events:exportAttendees': { request: ExportRequest; response: ExportResult }

  // Reports
  'reports:generate': { request: ReportRequest; response: ReportData }
  'reports:getHistory': { request: void; response: readonly ReportSummary[] }
  'reports:exportPDF': { request: { id: number }; response: ExportResult }
  'reports:deleteReport': { request: { id: number }; response: void }

  // Settings
  'settings:saveCredentials': { request: CredentialPayload; response: void }
  'settings:loadCredentials': { request: void; response: CredentialsState }
  'settings:testConnection': { request: TestConnectionPayload; response: ConnectionResult }

  // Agent
  'agent:getActions': { request: ActionFilters; response: readonly AgentAction[] }
  'agent:approve': { request: { id: number }; response: void }
  'agent:reject': { request: { id: number }; response: void }
  'agent:pause': { request: void; response: void }
  'agent:resume': { request: void; response: void }
  'agent:updateProfile': { request: AgentProfile; response: void }
  'agent:getProfile': { request: void; response: AgentProfile }
  'agent:getPatterns': { request: void; response: readonly AgentPattern[] }
  'agent:savePattern': { request: AgentPattern; response: { id: number } }
  'agent:getAutomations': { request: void; response: readonly Automation[] }
  'agent:saveAutomation': { request: Automation; response: { id: number } }
}
```

## Response Envelope

Every response wrapped:

```typescript
type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Preload Bridge

`src/preload/index.ts` exposes:

```typescript
contextBridge.exposeInMainWorld('api', {
  invoke: <K extends keyof IpcContract>(
    channel: K,
    payload: IpcContract[K]['request']
  ): Promise<IpcResult<IpcContract[K]['response']>>
})
```

## Renderer Hook

`src/renderer/hooks/useIpc.ts`:

```typescript
function useIpc<K extends keyof IpcContract>(
  channel: K,
  payload: IpcContract[K]['request'],
  options?: { autoFetch?: boolean; refreshInterval?: number }
): {
  data: IpcContract[K]['response'] | null
  loading: boolean
  error: string | null
  refetch: () => void
}
```

## Main Process Handler Registration

```typescript
function registerHandler<K extends keyof IpcContract>(
  channel: K,
  handler: (payload: IpcContract[K]['request']) => Promise<IpcContract[K]['response']>
): void
```

Wraps every handler in try-catch, logs errors, returns `IpcResult` envelope automatically.
