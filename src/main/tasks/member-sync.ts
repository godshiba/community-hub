import { syncMembers } from '../ipc/moderation'

const SIX_HOURS = 6 * 60 * 60 * 1000

let intervalHandle: ReturnType<typeof setInterval> | null = null

export function startMemberSync(): void {
  // Initial sync after 30s (let platforms connect first)
  setTimeout(() => {
    syncMembers().catch(() => {})
  }, 30_000)

  // Then every 6 hours
  intervalHandle = setInterval(() => {
    syncMembers().catch(() => {})
  }, SIX_HOURS)
}

export function stopMemberSync(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
