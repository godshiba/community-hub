import { registerHandler } from './register-handler'
import { getPlatformManager } from '../services/platform-manager'
import * as repo from '../services/moderation.repository'
import { logAuditEntry } from '../services/audit.repository'
import { checkEscalation } from '../services/escalation.engine'
import type { BulkActionResult } from '@shared/moderation-types'

export function registerModerationHandlers(): void {
  registerHandler('moderation:getMembers', (filter) => {
    return repo.getMembers(filter)
  })

  registerHandler('moderation:getMemberDetail', (payload) => {
    return repo.getMemberDetail(payload.id)
  })

  registerHandler('moderation:warnUser', async (payload) => {
    repo.addWarning(payload.memberId, payload.reason, 'app')

    const member = repo.getMemberById(payload.memberId)
    if (member) {
      logAuditEntry({
        moderator: 'app',
        moderatorType: 'human',
        targetMemberId: payload.memberId,
        targetUsername: member.username,
        actionType: 'warn',
        reason: payload.reason,
        platform: member.platform
      })
      await checkEscalation(payload.memberId, member.platform)
    }
  })

  registerHandler('moderation:banUser', async (payload) => {
    const member = repo.getMemberById(payload.memberId)
    if (!member) throw new Error(`Member ${payload.memberId} not found`)

    const mgr = getPlatformManager()
    if (member.platform === 'discord' || member.platform === 'telegram') {
      const service = member.platform === 'discord' ? mgr.discord : mgr.telegram
      if (service.status === 'connected') {
        await service.banUser(member.platformUserId, payload.reason)
      }
    }

    repo.banMember(payload.memberId, payload.reason)

    logAuditEntry({
      moderator: 'app',
      moderatorType: 'human',
      targetMemberId: payload.memberId,
      targetUsername: member.username,
      actionType: 'ban',
      reason: payload.reason,
      platform: member.platform
    })
  })

  registerHandler('moderation:unbanUser', async (payload) => {
    const member = repo.getMemberById(payload.id)
    if (!member) throw new Error(`Member ${payload.id} not found`)

    const mgr = getPlatformManager()
    if (member.platform === 'discord' || member.platform === 'telegram') {
      const service = member.platform === 'discord' ? mgr.discord : mgr.telegram
      if (service.status === 'connected') {
        await service.unbanUser(member.platformUserId)
      }
    }

    repo.unbanMember(payload.id)

    logAuditEntry({
      moderator: 'app',
      moderatorType: 'human',
      targetMemberId: payload.id,
      targetUsername: member.username,
      actionType: 'unban',
      reason: null,
      platform: member.platform
    })
  })

  registerHandler('moderation:updateNotes', (payload) => {
    repo.updateNotes(payload.memberId, payload.notes)
  })

  // --- Bulk moderation handlers (Phase 3) ---

  registerHandler('moderation:bulkWarn', async (payload) => {
    return executeBulkAction('warn', payload.memberIds, payload.reason)
  })

  registerHandler('moderation:bulkBan', async (payload) => {
    return executeBulkAction('ban', payload.memberIds, payload.reason)
  })

  registerHandler('moderation:bulkKick', async (payload) => {
    return executeBulkAction('kick', payload.memberIds, payload.reason)
  })

  registerHandler('moderation:syncMembers', async () => {
    return syncMembers()
  })

  registerHandler('moderation:exportMembers', (filter) => {
    return repo.exportMembers(filter)
  })
}

// ---------------------------------------------------------------------------
// Bulk action executor with rate limiting
// ---------------------------------------------------------------------------

const RATE_LIMIT_DELAY_MS = 300 // 300ms between platform API calls

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function executeBulkAction(
  action: 'warn' | 'ban' | 'kick',
  memberIds: readonly number[],
  reason: string
): Promise<BulkActionResult> {
  const mgr = getPlatformManager()
  const errors: string[] = []
  let succeeded = 0

  for (const memberId of memberIds) {
    const member = repo.getMemberById(memberId)
    if (!member) {
      errors.push(`Member ${memberId} not found`)
      continue
    }

    try {
      if (action === 'warn') {
        repo.addWarning(memberId, reason, 'app')
        await checkEscalation(memberId, member.platform)
      } else {
        // Platform API call for ban/kick
        const service = member.platform === 'discord' ? mgr.discord : mgr.telegram
        if (service.status === 'connected') {
          if (action === 'ban') {
            await service.banUser(member.platformUserId, reason)
          } else {
            await service.kickUser(member.platformUserId, reason)
          }
          await delay(RATE_LIMIT_DELAY_MS)
        }

        if (action === 'ban') {
          repo.banMember(memberId, reason)
        } else if (action === 'kick') {
          repo.kickMember(memberId, reason)
        }
      }

      logAuditEntry({
        moderator: 'app',
        moderatorType: 'human',
        targetMemberId: memberId,
        targetUsername: member.username,
        actionType: action === 'warn' ? 'warn' : action === 'ban' ? 'ban' : 'kick',
        reason,
        platform: member.platform,
        metadata: { bulk: true, batchSize: memberIds.length }
      })

      succeeded++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${member.username}: ${msg}`)
    }
  }

  return { total: memberIds.length, succeeded, failed: memberIds.length - succeeded, errors }
}

/** Fetch members from all connected platforms and upsert into DB */
export async function syncMembers(): Promise<{ synced: number }> {
  const mgr = getPlatformManager()
  let synced = 0
  const errors: string[] = []

  for (const service of [mgr.discord, mgr.telegram]) {
    if (service.status !== 'connected') continue

    try {
      const members = await service.fetchMembers()
      const activePlatformIds = new Set<string>()

      for (const m of members) {
        activePlatformIds.add(m.platformUserId)
        try {
          repo.upsertMember(m.platform, m.platformUserId, m.username, m.joinDate, m.status)
          synced++
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`upsert ${m.username}: ${msg}`)
        }
      }

      // Mark members no longer on the platform as 'left'
      repo.markAbsentMembersAsLeft(service.platform, activePlatformIds)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${service.platform} fetchMembers: ${msg}`)
    }
  }

  if (synced === 0 && errors.length > 0) {
    throw new Error(`Sync failed: ${errors.join('; ')}`)
  }

  return { synced }
}
