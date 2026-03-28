import { getPlatformManager } from '../services/platform-manager'
import { insertStats } from '../services/analytics.repository'
import type { StatsSyncResult } from '@shared/analytics-types'

let intervalId: ReturnType<typeof setInterval> | null = null

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000 // 60 minutes

export async function syncStats(): Promise<StatsSyncResult> {
  const manager = getPlatformManager()
  const result: StatsSyncResult = {
    syncedAt: new Date().toISOString(),
    discord: { members: 0, online: 0 },
    telegram: { members: 0 }
  }

  if (manager.discord.status === 'connected') {
    const stats = await manager.discord.getStats()
    insertStats('discord', {
      member_count: stats.memberCount,
      online_count: stats.onlineCount,
      message_count: stats.messageCountToday
    })
    result.discord.members = stats.memberCount
    result.discord.online = stats.onlineCount
  }

  if (manager.telegram.status === 'connected') {
    const stats = await manager.telegram.getStats()
    insertStats('telegram', {
      member_count: stats.memberCount,
      online_count: stats.onlineCount,
      message_count: stats.messageCountToday
    })
    result.telegram.members = stats.memberCount
  }

  return result
}

export function startStatsSync(intervalMs?: number): void {
  if (intervalId) return
  const ms = intervalMs ?? DEFAULT_INTERVAL_MS

  // Run immediately on start
  syncStats().catch(() => {})

  intervalId = setInterval(() => {
    syncStats().catch(() => {})
  }, ms)
}

export function stopStatsSync(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
