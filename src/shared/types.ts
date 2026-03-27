/** Panel identifiers for IDE-style navigation */
export type PanelId =
  | 'dashboard'
  | 'agent'
  | 'scheduler'
  | 'moderation'
  | 'events'
  | 'reports'
  | 'settings'

/** Standard IPC response envelope */
export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
