import type { IpcResult } from './types'

/**
 * Master IPC contract. Every channel is typed here.
 * Request/response types will be refined per module in later phases.
 * For now, placeholder types keep the bridge functional.
 */
export interface IpcContract {
  // Window controls
  'window:minimize': { request: void; response: void }
  'window:maximize': { request: void; response: void }
  'window:close': { request: void; response: void }

  // Health check (used to verify IPC bridge)
  'app:ping': { request: void; response: { pong: true; timestamp: number } }

  // Analytics
  'analytics:getStats': { request: unknown; response: unknown }
  'analytics:syncNow': { request: void; response: unknown }
  'analytics:exportStats': { request: unknown; response: unknown }

  // Scheduler
  'scheduler:createPost': { request: unknown; response: { id: number } }
  'scheduler:getQueue': { request: void; response: readonly unknown[] }
  'scheduler:editPost': { request: unknown; response: void }
  'scheduler:cancelPost': { request: { id: number }; response: void }
  'scheduler:sendNow': { request: { id: number }; response: unknown }

  // Moderation
  'moderation:getMembers': { request: unknown; response: readonly unknown[] }
  'moderation:getMemberDetail': { request: { id: number }; response: unknown }
  'moderation:warnUser': { request: unknown; response: void }
  'moderation:banUser': { request: unknown; response: void }
  'moderation:unbanUser': { request: { id: number }; response: void }
  'moderation:exportMembers': { request: unknown; response: unknown }

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

  // Settings
  'settings:saveCredentials': { request: unknown; response: void }
  'settings:loadCredentials': { request: void; response: unknown }
  'settings:testConnection': { request: unknown; response: unknown }

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
