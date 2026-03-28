import type { ConnectionStatus, Platform } from '@shared/settings-types'

/** Unified interface every platform service must implement */
export interface PlatformService {
  readonly platform: Platform
  readonly status: ConnectionStatus

  connect(token: string): Promise<{ success: boolean; username?: string; error?: string }>
  disconnect(): void
  testConnection(token: string): Promise<{ success: boolean; username?: string; error?: string }>

  getStats(): Promise<PlatformStats>
}

export interface PlatformStats {
  memberCount: number
  onlineCount: number
  messageCountToday: number
}
