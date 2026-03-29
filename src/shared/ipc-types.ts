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

  // Events
  'events:create': { request: unknown; response: { id: number } }
  'events:getAll': { request: unknown; response: readonly unknown[] }
  'events:getDetail': { request: { id: number }; response: unknown }
  'events:updateEvent': { request: unknown; response: void }
  'events:deleteEvent': { request: { id: number }; response: void }
  'events:getRSVPs': { request: { eventId: number }; response: readonly unknown[] }
  'events:exportAttendees': { request: unknown; response: unknown }

  // Reports
  'reports:generate': { request: unknown; response: unknown }
  'reports:getHistory': { request: void; response: readonly unknown[] }
  'reports:exportPDF': { request: { id: number }; response: unknown }
  'reports:deleteReport': { request: { id: number }; response: void }

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

  // Agent
  'agent:getActions': { request: unknown; response: readonly unknown[] }
  'agent:approve': { request: { id: number }; response: void }
  'agent:reject': { request: { id: number }; response: void }
  'agent:pause': { request: void; response: void }
  'agent:resume': { request: void; response: void }
  'agent:updateProfile': { request: unknown; response: void }
  'agent:getProfile': { request: void; response: unknown }
  'agent:getPatterns': { request: void; response: readonly unknown[] }
  'agent:savePattern': { request: unknown; response: { id: number } }
  'agent:getAutomations': { request: void; response: readonly unknown[] }
  'agent:saveAutomation': { request: unknown; response: { id: number } }
}

export type IpcChannel = keyof IpcContract

export type { IpcResult }
