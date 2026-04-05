import type { ConnectionStatus, Platform } from '@shared/settings-types'
import type { ChannelInfo } from '@shared/scheduler-types'

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

  /** List channels/chats available for posting */
  listChannels(): ChannelInfo[]

  /** Send a text message to a channel/chat */
  sendMessage(channelId: string, content: string): Promise<{ messageId: string }>

  /** Fetch members from the platform for syncing to local DB */
  fetchMembers(): Promise<PlatformMember[]>

  /** Ban a user on the platform */
  banUser(platformUserId: string, reason?: string): Promise<void>

  /** Unban a user on the platform */
  unbanUser(platformUserId: string): Promise<void>

  /** Mute/timeout a user for a duration (minutes). Not all platforms support this. */
  muteUser(platformUserId: string, durationMinutes: number, channelId?: string): Promise<void>

  /** Delete a specific message by ID */
  deleteMessage(channelId: string, messageId: string): Promise<void>
}

export interface PlatformMember {
  platformUserId: string
  username: string
  platform: 'discord' | 'telegram'
  joinDate: string | null
  status: 'active' | 'banned'
}

export interface PlatformStats {
  memberCount: number
  onlineCount: number
  messageCountToday: number
}

/** Callback for incoming platform messages */
export interface PlatformMessage {
  platform: 'discord' | 'telegram'
  channelId: string
  messageId: string
  userId: string
  username: string
  content: string
}

/** Callback for new member events */
export interface PlatformNewMember {
  platform: 'discord' | 'telegram'
  channelId: string
  userId: string
  username: string
}

export type MessageCallback = (msg: PlatformMessage) => void
export type NewMemberCallback = (member: PlatformNewMember) => void
