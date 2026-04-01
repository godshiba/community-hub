import { registerHandler } from './register-handler'
import { getAgentService } from '../services/ai/agent.service'
import * as repo from '../services/ai/agent.repository'
import { saveProfile } from '../services/ai/profile.service'

export function registerAgentHandlers(): void {
  registerHandler('agent:getStatus', () => {
    return getAgentService().getStatus()
  })

  registerHandler('agent:getActions', (filter) => {
    return repo.getActions(filter)
  })

  registerHandler('agent:approve', (payload) => {
    repo.updateActionStatus(payload.id, 'approved')
  })

  registerHandler('agent:reject', (payload) => {
    repo.updateActionStatus(payload.id, 'rejected')
  })

  registerHandler('agent:editAction', (payload) => {
    repo.updateActionOutput(payload.id, payload.output)
    repo.updateActionStatus(payload.id, 'edited')
  })

  registerHandler('agent:pause', () => {
    getAgentService().pause()
  })

  registerHandler('agent:resume', () => {
    getAgentService().resume()
  })

  registerHandler('agent:getProfile', () => {
    return repo.getProfile()
  })

  registerHandler('agent:updateProfile', (payload) => {
    const profile = saveProfile(payload)
    getAgentService().refreshAll()
    return profile
  })

  registerHandler('agent:getPatterns', () => {
    return repo.getPatterns()
  })

  registerHandler('agent:savePattern', (payload) => {
    const pattern = repo.savePattern(payload)
    getAgentService().refreshAll()
    return pattern
  })

  registerHandler('agent:deletePattern', (payload) => {
    repo.deletePattern(payload.id)
    getAgentService().refreshAll()
  })

  registerHandler('agent:getAutomations', () => {
    return repo.getAutomations()
  })

  registerHandler('agent:saveAutomation', (payload) => {
    const automation = repo.saveAutomation(payload)
    getAgentService().refreshAll()
    return automation
  })

  registerHandler('agent:deleteAutomation', (payload) => {
    repo.deleteAutomation(payload.id)
    getAgentService().refreshAll()
  })

  registerHandler('agent:toggleAutomation', (payload) => {
    repo.toggleAutomation(payload.id, payload.enabled)
    getAgentService().refreshAll()
  })

  registerHandler('agent:testProvider', async () => {
    return getAgentService().testProvider()
  })
}
