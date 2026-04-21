import { registerHandler } from './register-handler'
import * as memoryRepo from '../services/ai/user-memory.repository'
import * as brainConfigService from '../services/ai/brain-config.service'
import type { Platform } from '@shared/settings-types'

export function registerAgentBrainHandlers(): void {
  // --- existing Phase 5b handlers ---

  registerHandler('agent:getUserMemory', (payload) => {
    return memoryRepo.getUserMemory(payload.platform, payload.userId)
  })

  registerHandler('agent:getUserConversations', (payload) => {
    return memoryRepo.getConversationHistory(
      payload.platform as Platform,
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

  // --- Phase 5b+ management handlers ---

  registerHandler('agent:updateFacts', (payload) => {
    memoryRepo.updateFacts(
      payload.platform as Platform,
      payload.userId,
      payload.facts
    )
  })

  registerHandler('agent:updateSummary', (payload) => {
    memoryRepo.updateSummary(
      payload.platform as Platform,
      payload.userId,
      payload.summary
    )
  })

  registerHandler('agent:deleteTurns', (payload) => {
    memoryRepo.deleteTurns(payload.ids)
  })

  registerHandler('agent:listMemoryUsers', (payload) => {
    return memoryRepo.listMemoryUsers(
      payload.limit ?? 50,
      payload.offset ?? 0,
      payload.sortBy ?? 'lastSeen'
    )
  })

  registerHandler('agent:getMemoryStats', () => {
    return memoryRepo.getMemoryStats()
  })

  registerHandler('agent:runCompaction', async () => {
    const { runCompaction } = await import('../tasks/memory-compaction')
    const compacted = await runCompaction()
    return { compacted }
  })

  registerHandler('agent:getBrainConfig', () => {
    return brainConfigService.getBrainConfig()
  })

  registerHandler('agent:updateBrainConfig', (payload) => {
    return brainConfigService.updateBrainConfig(payload)
  })
}
