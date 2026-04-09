import { registerHandler } from './register-handler'
import * as repo from '../services/roles.repository'
import * as service from '../services/roles.service'

export function registerRoleHandlers(): void {
  registerHandler('roles:getRules', () => {
    return repo.getRules()
  })

  registerHandler('roles:saveRule', (payload) => {
    return repo.saveRule(payload)
  })

  registerHandler('roles:deleteRule', (payload) => {
    repo.deleteRule(payload.id)
  })

  registerHandler('roles:toggleRule', (payload) => {
    repo.toggleRule(payload.id, payload.enabled)
  })

  registerHandler('roles:getRoles', async (payload) => {
    return service.fetchPlatformRoles(payload.platform)
  })

  registerHandler('roles:getAssignments', (payload) => {
    return repo.getAssignments(payload.memberId)
  })

  registerHandler('roles:assignRole', async (payload) => {
    return service.assignRoleToMember(
      payload.memberId,
      payload.roleId,
      payload.roleName,
      payload.durationHours
    )
  })

  registerHandler('roles:removeRole', async (payload) => {
    await service.removeRoleFromMember(payload.assignmentId)
  })
}
