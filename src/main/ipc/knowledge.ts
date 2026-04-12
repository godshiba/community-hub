import { registerHandler } from './register-handler'
import * as knowledgeRepo from '../services/ai/knowledge.repository'
import { invalidateChannelConfigCache } from '../services/ai/channel-config.service'
import { getAgentService } from '../services/ai/agent.service'

export function registerKnowledgeHandlers(): void {
  // --- Knowledge Entries ---

  registerHandler('knowledge:getEntries', (filter) => {
    return knowledgeRepo.getEntries(filter ?? undefined)
  })

  registerHandler('knowledge:getEntry', (payload) => {
    return knowledgeRepo.getEntry(payload.id)
  })

  registerHandler('knowledge:createEntry', (payload) => {
    return knowledgeRepo.createEntry(payload)
  })

  registerHandler('knowledge:updateEntry', (payload) => {
    const { id, ...rest } = payload
    return knowledgeRepo.updateEntry(id, rest)
  })

  registerHandler('knowledge:deleteEntry', (payload) => {
    knowledgeRepo.deleteEntry(payload.id)
  })

  registerHandler('knowledge:search', (query) => {
    return knowledgeRepo.searchEntries(query)
  })

  registerHandler('knowledge:import', (payload) => {
    return knowledgeRepo.bulkImportEntries(payload.entries)
  })

  // --- Categories ---

  registerHandler('knowledge:getCategories', () => {
    return knowledgeRepo.getCategories()
  })

  registerHandler('knowledge:createCategory', (payload) => {
    return knowledgeRepo.createCategory(payload)
  })

  registerHandler('knowledge:updateCategory', (payload) => {
    const { id, ...rest } = payload
    return knowledgeRepo.updateCategory(id, rest)
  })

  registerHandler('knowledge:deleteCategory', (payload) => {
    knowledgeRepo.deleteCategory(payload.id)
  })

  // --- Channel Agent Config ---

  registerHandler('knowledge:getChannelConfigs', () => {
    return knowledgeRepo.getChannelConfigs()
  })

  registerHandler('knowledge:getChannelConfig', (payload) => {
    return knowledgeRepo.getChannelConfig(payload.platform, payload.channelId)
  })

  registerHandler('knowledge:updateChannelConfig', (payload) => {
    const config = knowledgeRepo.upsertChannelConfig(payload)
    invalidateChannelConfigCache()
    getAgentService().refreshAll()
    return config
  })

  registerHandler('knowledge:deleteChannelConfig', (payload) => {
    knowledgeRepo.deleteChannelConfig(payload.id)
    invalidateChannelConfigCache()
    getAgentService().refreshAll()
  })
}
