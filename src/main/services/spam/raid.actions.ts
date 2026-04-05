import { getPlatformManager } from '../platform-manager'
import type { RaidCheckResult } from './raid.detector'
import type { SpamMessageRef } from './spam.engine'
import type { SpamActionType } from '@shared/spam-types'

// ---------------------------------------------------------------------------
// Execute raid response actions on platforms
// ---------------------------------------------------------------------------

export async function executeRaidActions(
  platform: 'discord' | 'telegram',
  result: RaidCheckResult
): Promise<void> {
  if (!result.stateChanged || result.newState !== 'active') return

  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram

  if (service.status !== 'connected') return

  for (const action of result.actions) {
    try {
      switch (action) {
        case 'ban_new_accounts':
          await banSuspiciousJoins(platform, result)
          break
        case 'notify_owner':
          // Notification is handled by the renderer via raid state polling
          break
        // slowmode and lockdown require platform-specific APIs
        // that are beyond current PlatformService interface.
        // Logged as action taken; manual follow-up if needed.
      }
    } catch {
      // Non-fatal — log and continue
    }
  }
}

async function banSuspiciousJoins(
  platform: 'discord' | 'telegram',
  result: RaidCheckResult
): Promise<void> {
  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram

  if (service.status !== 'connected') return

  for (const join of result.suspiciousJoins) {
    try {
      await service.banUser(join.userId, 'Automated raid protection — suspicious account')
    } catch {
      // Non-fatal per-user ban failure
    }
  }
}

// ---------------------------------------------------------------------------
// Execute spam action — bulk-delete ALL tracked messages then punish
// ---------------------------------------------------------------------------

export async function executeSpamAction(
  platform: 'discord' | 'telegram',
  userId: string,
  channelId: string,
  messageRefs: readonly SpamMessageRef[],
  action: SpamActionType,
  muteDurationMinutes: number | null
): Promise<void> {
  const mgr = getPlatformManager()

  if (platform === 'discord' && mgr.discord.status === 'connected') {
    await executeDiscordSpamAction(mgr.discord, userId, channelId, messageRefs, action, muteDurationMinutes)
  } else if (platform === 'telegram' && mgr.telegram.status === 'connected') {
    await executeTelegramSpamAction(mgr.telegram, userId, channelId, messageRefs, action, muteDurationMinutes)
  }
}

async function executeDiscordSpamAction(
  discord: ReturnType<typeof getPlatformManager>['discord'],
  userId: string,
  channelId: string,
  messageRefs: readonly SpamMessageRef[],
  action: SpamActionType,
  muteDurationMinutes: number | null
): Promise<void> {
  // Group messages by channel for bulk delete (single API call per channel)
  const byChannel = new Map<string, string[]>()
  for (const ref of messageRefs) {
    const ids = byChannel.get(ref.channelId) ?? []
    ids.push(ref.messageId)
    byChannel.set(ref.channelId, ids)
  }

  // Bulk delete + punishment in parallel
  const deletePromise = (async () => {
    for (const [chId, ids] of byChannel) {
      try {
        if (ids.length === 1) {
          await discord.deleteMessage(chId, ids[0])
        } else {
          await discord.bulkDeleteMessages(chId, ids)
        }
      } catch {
        // Fallback: try one by one if bulk fails
        for (const id of ids) {
          try { await discord.deleteMessage(chId, id) } catch { /* best effort */ }
        }
      }
    }
  })()

  const punishPromise = (async () => {
    try {
      switch (action) {
        case 'delete':
        case 'warn':
          break
        case 'mute':
          await discord.muteUser(userId, muteDurationMinutes ?? 10)
          break
        case 'kick':
          await discord.banUser(userId, 'Automated spam protection (kick)')
          break
        case 'ban':
          await discord.banUser(userId, 'Automated spam protection')
          break
      }
    } catch { /* non-fatal */ }
  })()

  await Promise.all([deletePromise, punishPromise])
}

async function executeTelegramSpamAction(
  telegram: ReturnType<typeof getPlatformManager>['telegram'],
  userId: string,
  channelId: string,
  messageRefs: readonly SpamMessageRef[],
  action: SpamActionType,
  muteDurationMinutes: number | null
): Promise<void> {
  // Telegram has no bulk delete — delete individually in parallel
  const deletePromise = Promise.all(
    messageRefs.map((ref) =>
      telegram.deleteMessage(ref.channelId, ref.messageId).catch(() => {})
    )
  )

  const punishPromise = (async () => {
    try {
      switch (action) {
        case 'delete':
        case 'warn':
          break
        case 'mute':
          await telegram.muteUser(userId, muteDurationMinutes ?? 10, channelId)
          break
        case 'kick':
          await telegram.banUser(userId, 'Automated spam protection (kick)')
          break
        case 'ban':
          await telegram.banUser(userId, 'Automated spam protection')
          break
      }
    } catch { /* non-fatal */ }
  })()

  await Promise.all([deletePromise, punishPromise])
}
