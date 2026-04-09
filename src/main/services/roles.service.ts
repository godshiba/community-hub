import { getPlatformManager } from './platform-manager'
import * as repo from './roles.repository'
import { getMemberById } from './moderation.repository'
import { logAuditEntry } from './audit.repository'
import type { RoleAssignment, PlatformRole } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

export async function fetchPlatformRoles(platform: Platform): Promise<readonly PlatformRole[]> {
  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram

  if (service.status !== 'connected') {
    throw new Error(`${platform} is not connected`)
  }

  const roles = await service.fetchRoles()
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    position: r.position
  }))
}

export async function assignRoleToMember(
  memberId: number,
  roleId: string,
  roleName: string,
  durationHours: number | null
): Promise<RoleAssignment> {
  const member = getMemberById(memberId)
  if (!member) throw new Error(`Member ${memberId} not found`)

  const mgr = getPlatformManager()
  const service = member.platform === 'discord' ? mgr.discord : mgr.telegram

  if (service.status === 'connected') {
    await service.assignRole(member.platformUserId, roleId)
  }

  const assignment = repo.createAssignment(memberId, member.platform, roleId, roleName, durationHours)

  logAuditEntry({
    moderator: 'app',
    moderatorType: 'human',
    targetMemberId: memberId,
    targetUsername: member.username,
    actionType: 'note',
    reason: `Assigned role "${roleName}"${durationHours ? ` for ${durationHours}h` : ''}`,
    platform: member.platform
  })

  return assignment
}

export async function removeRoleFromMember(assignmentId: number): Promise<void> {
  const assignments = repo.getAssignments()
  const assignment = assignments.find((a) => a.id === assignmentId)
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

  const member = getMemberById(assignment.memberId)
  if (member) {
    const mgr = getPlatformManager()
    const service = member.platform === 'discord' ? mgr.discord : mgr.telegram

    if (service.status === 'connected') {
      try {
        await service.removeRole(member.platformUserId, assignment.roleId)
      } catch { /* role may already be removed on platform */ }
    }

    logAuditEntry({
      moderator: 'app',
      moderatorType: 'human',
      targetMemberId: member.id,
      targetUsername: member.username,
      actionType: 'note',
      reason: `Removed role "${assignment.roleName}"`,
      platform: member.platform
    })
  }

  repo.removeAssignment(assignmentId)
}

/** Called by auto-assign rules when a new member joins */
export async function handleAutoAssignOnJoin(platform: Platform, platformUserId: string, username: string): Promise<void> {
  const rules = repo.getAutoAssignRules(platform)
  if (rules.length === 0) return

  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram
  if (service.status !== 'connected') return

  for (const rule of rules) {
    try {
      await service.assignRole(platformUserId, rule.roleId)
    } catch { /* non-fatal: role may not exist or bot lacks permission */ }
  }
}
