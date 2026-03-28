import type { Platform } from './settings-types'

export type PostStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'error'

/** A channel/chat the user can target for posting */
export interface ChannelInfo {
  readonly id: string
  readonly name: string
  readonly platform: Platform
  readonly guildId?: string    // Discord only
  readonly guildName?: string  // Discord only
}

/** What the renderer sends to create or update a post */
export interface PostPayload {
  readonly title: string
  readonly content: string
  readonly platforms: readonly Platform[]
  readonly channelIds: Record<Platform, string>  // platform → channelId
  readonly scheduledTime: string | null          // ISO string, null = draft
}

/** A row from the scheduled_posts table */
export interface ScheduledPost {
  readonly id: number
  readonly title: string
  readonly content: string
  readonly platforms: readonly Platform[]
  readonly channelIds: Record<string, string>
  readonly scheduledTime: string | null
  readonly sentTime: string | null
  readonly status: PostStatus
  readonly errorMessage: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

/** Per-platform send result stored in post_history */
export interface PostHistoryEntry {
  readonly id: number
  readonly postId: number
  readonly platform: Platform
  readonly platformMessageId: string | null
  readonly success: boolean
  readonly errorText: string | null
  readonly sentAt: string | null
}

/** What the send-now or auto-send returns */
export interface SendResult {
  readonly postId: number
  readonly results: readonly PostHistoryEntry[]
}
