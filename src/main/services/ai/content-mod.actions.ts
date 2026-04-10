import type { ContentActionType } from '@shared/content-moderation-types'
import type { Platform } from '@shared/settings-types'
import { getPlatformManager } from '../platform-manager'

export async function executeContentAction(
  action: ContentActionType,
  platform: Platform,
  userId: string,
  channelId: string,
  messageId: string | null
): Promise<void> {
  if (action === 'ignore' || action === 'flag') return

  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram

  if (service.status !== 'connected') return

  switch (action) {
    case 'delete':
      if (messageId) {
        await service.deleteMessage(channelId, messageId).catch(() => {})
      }
      break
    case 'warn':
      if (messageId) {
        await service.deleteMessage(channelId, messageId).catch(() => {})
      }
      await service.sendMessage(
        channelId,
        `Warning: Your message was removed for violating community guidelines.`
      ).catch(() => {})
      break
    case 'mute':
      if (messageId) {
        await service.deleteMessage(channelId, messageId).catch(() => {})
      }
      await service.muteUser(userId, 10, channelId).catch(() => {})
      break
    case 'ban':
      if (messageId) {
        await service.deleteMessage(channelId, messageId).catch(() => {})
      }
      await service.banUser(userId, 'Content policy violation').catch(() => {})
      break
  }
}
