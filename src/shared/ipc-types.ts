import type { IpcResult } from './types'
import type {
  SaveCredentialPayload,
  CredentialsState,
  TestConnectionPayload,
  ConnectionResult,
  AiConfig,
  AppPreferences,
  PlatformStatus
} from './settings-types'
import type {
  StatsRequest,
  AnalyticsData,
  StatsSyncResult,
  ExportRequest,
  ExportResult
} from './analytics-types'
import type {
  PostPayload,
  ScheduledPost,
  SendResult,
  PostHistoryEntry,
  ChannelInfo
} from './scheduler-types'
import type {
  MembersFilter,
  MembersPage,
  MemberDetail,
  WarnPayload,
  BanPayload,
  NotePayload,
  ExportResult as ModerationExportResult
} from './moderation-types'
import type {
  EventPayload,
  CommunityEvent,
  EventDetail,
  EventsFilter,
  EventRSVP,
  ExportAttendeesResult
} from './events-types'
import type {
  AgentStatus,
  AgentProfile,
  AgentProfilePayload,
  AgentPattern,
  AgentPatternPayload,
  AgentAutomation,
  AgentAutomationPayload,
  AgentAction,
  AgentActionsFilter,
  AgentEditActionPayload
} from './agent-types'
import type {
  ReportConfig,
  ReportData,
  SavedReport,
  ReportExportResult
} from './reports-types'

/**
 * Master IPC contract. Every channel is typed here.
 * Request/response types will be refined per module in later phases.
 */
export interface IpcContract {
  // Window controls
  'window:minimize': { request: void; response: void }
  'window:maximize': { request: void; response: void }
  'window:close': { request: void; response: void }

  // Health check (used to verify IPC bridge)
  'app:ping': { request: void; response: { pong: true; timestamp: number } }

  // Analytics — typed in Phase 3
  'analytics:getStats': { request: StatsRequest; response: AnalyticsData }
  'analytics:syncNow': { request: void; response: StatsSyncResult }
  'analytics:exportStats': { request: ExportRequest; response: ExportResult }

  // Scheduler — typed in Phase 4
  'scheduler:createPost': { request: PostPayload; response: ScheduledPost }
  'scheduler:updatePost': { request: { id: number } & PostPayload; response: ScheduledPost }
  'scheduler:getQueue': { request: void; response: readonly ScheduledPost[] }
  'scheduler:getHistory': { request: void; response: readonly PostHistoryEntry[] }
  'scheduler:cancelPost': { request: { id: number }; response: void }
  'scheduler:sendNow': { request: { id: number }; response: SendResult }
  'scheduler:getChannels': { request: void; response: readonly ChannelInfo[] }

  // Moderation — typed in Phase 5
  'moderation:getMembers': { request: MembersFilter; response: MembersPage }
  'moderation:getMemberDetail': { request: { id: number }; response: MemberDetail }
  'moderation:warnUser': { request: WarnPayload; response: void }
  'moderation:banUser': { request: BanPayload; response: void }
  'moderation:unbanUser': { request: { id: number }; response: void }
  'moderation:updateNotes': { request: NotePayload; response: void }
  'moderation:syncMembers': { request: void; response: { synced: number } }
  'moderation:exportMembers': { request: MembersFilter; response: ModerationExportResult }

  // Events — typed in Phase 6
  'events:create': { request: EventPayload; response: CommunityEvent }
  'events:getAll': { request: EventsFilter; response: readonly CommunityEvent[] }
  'events:getDetail': { request: { id: number }; response: EventDetail }
  'events:updateEvent': { request: { id: number } & EventPayload; response: CommunityEvent }
  'events:deleteEvent': { request: { id: number }; response: void }
  'events:getRSVPs': { request: { eventId: number }; response: readonly EventRSVP[] }
  'events:exportAttendees': { request: { eventId: number }; response: ExportAttendeesResult }

  // Reports — typed in Phase 8
  'reports:generate': { request: ReportConfig; response: SavedReport }
  'reports:list': { request: void; response: readonly SavedReport[] }
  'reports:get': { request: { id: number }; response: SavedReport }
  'reports:delete': { request: { id: number }; response: void }
  'reports:exportPDF': { request: { id: number }; response: ReportExportResult }

  // Settings — typed in Phase 2
  'settings:saveCredentials': { request: SaveCredentialPayload; response: void }
  'settings:loadCredentials': { request: void; response: CredentialsState }
  'settings:testConnection': { request: TestConnectionPayload; response: ConnectionResult }
  'settings:saveAiConfig': { request: AiConfig; response: void }
  'settings:loadAiConfig': { request: void; response: AiConfig }
  'settings:savePreferences': { request: AppPreferences; response: void }
  'settings:loadPreferences': { request: void; response: AppPreferences }
  'settings:getPlatformStatus': { request: void; response: PlatformStatus }
  'settings:connectPlatform': { request: TestConnectionPayload; response: ConnectionResult }
  'settings:disconnectPlatform': { request: TestConnectionPayload; response: void }

  // Agent — typed in Phase 7
  'agent:getStatus': { request: void; response: AgentStatus }
  'agent:getActions': { request: AgentActionsFilter; response: readonly AgentAction[] }
  'agent:approve': { request: { id: number }; response: void }
  'agent:reject': { request: { id: number }; response: void }
  'agent:editAction': { request: AgentEditActionPayload; response: void }
  'agent:pause': { request: void; response: void }
  'agent:resume': { request: void; response: void }
  'agent:getProfile': { request: void; response: AgentProfile | null }
  'agent:updateProfile': { request: AgentProfilePayload; response: AgentProfile }
  'agent:getPatterns': { request: void; response: readonly AgentPattern[] }
  'agent:savePattern': { request: AgentPatternPayload; response: AgentPattern }
  'agent:deletePattern': { request: { id: number }; response: void }
  'agent:getAutomations': { request: void; response: readonly AgentAutomation[] }
  'agent:saveAutomation': { request: AgentAutomationPayload; response: AgentAutomation }
  'agent:deleteAutomation': { request: { id: number }; response: void }
  'agent:toggleAutomation': { request: { id: number; enabled: boolean }; response: void }
  'agent:testProvider': { request: void; response: { success: boolean; error?: string } }
}

export type IpcChannel = keyof IpcContract

export type { IpcResult }
