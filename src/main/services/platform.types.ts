import type { ConnectionStatus, Platform } from '@shared/settings-types'

/** Unified interface every platform service must implement */
export interface PlatformService {
  readonly platform: Platform
  readonly status: ConnectionStatus

  /** Connect using token from .env */
  connect(): Promise<{ success: boolean; username?: string; error?: string }>
  disconnect(): void
  /** Test connection using token from .env */
  testConnection(): Promise<{ success: boolean; username?: string; error?: string }>

  getStats(): Promise<PlatformStats>
}

export interface PlatformStats {
  memberCount: number
  onlineCount: number
  messageCountToday: number
}
