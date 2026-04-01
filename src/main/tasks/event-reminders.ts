import { getPlatformManager } from '../services/platform-manager'
import { getDueReminders, markReminderSent } from '../services/events.repository'
import type { Platform } from '@shared/settings-types'

let intervalId: ReturnType<typeof setInterval> | null = null

const DEFAULT_INTERVAL_MS = 60 * 1000 // 60 seconds

export async function checkReminders(): Promise<number> {
  const due = getDueReminders()
  if (due.length === 0) return 0

  const mgr = getPlatformManager()
  let sent = 0

  for (const reminder of due) {
    const platform = reminder.eventPlatform as Platform | null
    if (!platform) {
      markReminderSent(reminder.id)
      sent++
      continue
    }

    const service = platform === 'discord' ? mgr.discord : mgr.telegram
    if (service.status !== 'connected') continue

    const message = `Reminder: "${reminder.eventTitle}" is starting soon!`

    try {
      // Send to the first available channel for that platform
      const channels = await service.getChannels()
      if (channels.length > 0) {
        await service.sendMessage(channels[0].id, message)
      }
      markReminderSent(reminder.id)
      sent++
    } catch {
      // Non-fatal: will retry on next interval
    }
  }

  return sent
}

export function startEventReminders(intervalMs?: number): void {
  if (intervalId) return
  const ms = intervalMs ?? DEFAULT_INTERVAL_MS

  // Run after a short delay to let platforms connect
  setTimeout(() => {
    checkReminders().catch(() => {})
  }, 5000)

  intervalId = setInterval(() => {
    checkReminders().catch(() => {})
  }, ms)
}

export function stopEventReminders(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
