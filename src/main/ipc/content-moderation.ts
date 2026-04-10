import { registerHandler } from './register-handler'
import * as repo from '../services/ai/content-moderation.repository'
import { executeContentAction } from '../services/ai/content-mod.actions'

export function registerContentModerationHandlers(): void {
  registerHandler('content-mod:getPolicy', () => {
    return repo.getPolicy()
  })

  registerHandler('content-mod:updatePolicy', (payload) => {
    return repo.savePolicy(payload)
  })

  registerHandler('content-mod:getFlags', (filter) => {
    return repo.getFlags(filter)
  })

  registerHandler('content-mod:reviewFlag', async (payload) => {
    const flag = repo.getFlagById(payload.flagId)
    if (!flag) throw new Error('Flag not found')

    repo.reviewFlag(payload.flagId, payload.decision)

    // If actioning, execute the original policy action on the platform
    if (payload.decision === 'action' && !flag.actionExecuted) {
      await executeContentAction(
        flag.policyAction,
        flag.platform,
        flag.userId,
        flag.channelId,
        flag.messageId
      )
    }
  })
}
