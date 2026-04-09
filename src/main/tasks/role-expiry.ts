import { getPlatformManager } from '../services/platform-manager'
import { getExpiredAssignments, markExpired } from '../services/roles.repository'
import { getMemberById } from '../services/moderation.repository'
import { logAuditEntry } from '../services/audit.repository'

let intervalId: ReturnType<typeof setInterval> | null = null

const DEFAULT_INTERVAL_MS = 60 * 1000 // 60 seconds

export async function checkExpiredRoles(): Promise<number> {
  const expired = getExpiredAssignments()
  if (expired.length === 0) return 0

  const mgr = getPlatformManager()
  let processed = 0

  for (const assignment of expired) {
    const member = getMemberById(assignment.memberId)

    if (member) {
      const service = member.platform === 'discord' ? mgr.discord : mgr.telegram
      if (service.status === 'connected') {
        try {
          await service.removeRole(member.platformUserId, assignment.roleId)
        } catch { /* role may already be removed */ }
      }

      logAuditEntry({
        moderator: 'system',
        moderatorType: 'system',
        targetMemberId: member.id,
        targetUsername: member.username,
        actionType: 'note',
        reason: `Temp role "${assignment.roleName}" expired`,
        platform: member.platform
      })
    }

    markExpired(assignment.id)
    processed++
  }

  return processed
}

export function startRoleExpiry(intervalMs?: number): void {
  if (intervalId) return
  const ms = intervalMs ?? DEFAULT_INTERVAL_MS

  setTimeout(() => {
    checkExpiredRoles().catch(() => {})
  }, 10000)

  intervalId = setInterval(() => {
    checkExpiredRoles().catch(() => {})
  }, ms)
}

export function stopRoleExpiry(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
