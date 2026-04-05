import { registerHandler } from './register-handler'
import * as repo from '../services/spam/spam.repository'
import * as engine from '../services/spam/spam.engine'
import * as raid from '../services/spam/raid.detector'

export function registerSpamHandlers(): void {
  registerHandler('spam:getConfig', () => {
    return repo.getSpamConfig()
  })

  registerHandler('spam:updateConfig', (config) => {
    repo.updateSpamConfig(config)
  })

  registerHandler('spam:getRules', () => {
    return repo.getRules()
  })

  registerHandler('spam:saveRule', (payload) => {
    return repo.saveRule(payload)
  })

  registerHandler('spam:deleteRule', (payload) => {
    repo.deleteRule(payload.id)
  })

  registerHandler('spam:toggleRule', (payload) => {
    repo.toggleRule(payload.id, payload.enabled)
  })

  registerHandler('spam:getEvents', (filter) => {
    return repo.getSpamEvents(filter)
  })

  registerHandler('spam:getRaidEvents', (payload) => {
    return repo.getRaidEvents(payload.limit)
  })

  registerHandler('spam:getRaidState', () => {
    return raid.getRaidState()
  })

  registerHandler('spam:setManualLockdown', (payload) => {
    raid.setManualLockdown(payload.enabled)
  })

  registerHandler('spam:testRule', (payload) => {
    return engine.testRule(payload.ruleType, payload.content)
  })
}
