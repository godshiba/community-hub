import { registerHandler } from './register-handler'
import * as memoryRepo from '../services/ai/user-memory.repository'

export function registerAgentBrainHandlers(): void {
  registerHandler('agent:getUserMemory', (payload) => {
    return memoryRepo.getUserMemory(payload.platform, payload.userId)
  })

  registerHandler('agent:getUserConversations', (payload) => {
    return memoryRepo.getConversationHistory(
      payload.platform as 'discord' | 'telegram',
      payload.userId,
      payload.limit ?? 20
    )
  })

  registerHandler('agent:clearUserMemory', (payload) => {
    memoryRepo.clearUserMemory(payload.platform, payload.userId)
  })

  registerHandler('agent:getRecentConversations', (payload) => {
    return memoryRepo.getRecentConversations(payload.limit ?? 20)
  })
}
