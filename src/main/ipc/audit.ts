import { registerHandler } from './register-handler'
import * as auditRepo from '../services/audit.repository'
import * as escalation from '../services/escalation.engine'

export function registerAuditHandlers(): void {
  registerHandler('moderation:getAuditLog', (filter) => {
    return auditRepo.getAuditLog(filter)
  })

  registerHandler('moderation:exportAuditLog', (filter) => {
    return auditRepo.exportAuditLog(filter)
  })

  registerHandler('moderation:getEscalationChains', () => {
    return escalation.getChains()
  })

  registerHandler('moderation:saveEscalationChain', (payload) => {
    return escalation.saveChain(payload)
  })

  registerHandler('moderation:deleteEscalationChain', (payload) => {
    escalation.deleteChain(payload.id)
  })

  registerHandler('moderation:toggleEscalationChain', (payload) => {
    escalation.toggleChain(payload.id, payload.enabled)
  })
}
