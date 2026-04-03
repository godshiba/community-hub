import { registerHandler } from './register-handler'
import { getPlatformManager } from '../services/platform-manager'
import * as repo from '../services/moderation.repository'

export function registerModerationHandlers(): void {
  registerHandler('moderation:getMembers', (filter) => {
    return repo.getMembers(filter)
  })

  registerHandler('moderation:getMemberDetail', (payload) => {
    return repo.getMemberDetail(payload.id)
  })

  registerHandler('moderation:warnUser', (payload) => {
    repo.addWarning(payload.memberId, payload.reason, 'app')
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
  })

  registerHandler('moderation:updateNotes', (payload) => {
    repo.updateNotes(payload.memberId, payload.notes)
  })

  registerHandler('moderation:syncMembers', async () => {
    return syncMembers()
  })

  registerHandler('moderation:exportMembers', (filter) => {
    return repo.exportMembers(filter)
  })
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
      for (const m of members) {
        try {
          repo.upsertMember(m.platform, m.platformUserId, m.username, m.joinDate, m.status)
          synced++
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`upsert ${m.username}: ${msg}`)
        }
      }
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
