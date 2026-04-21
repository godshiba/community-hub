import { create } from 'zustand'
import type {
  UserMemory,
  ConversationTurn,
  MemoryUserEntry,
  MemoryStats,
  BrainConfig
} from '@shared/agent-brain-types'
import type { Platform } from '@shared/settings-types'

interface AgentBrainState {
  // User memory
  selectedMemory: UserMemory | null
  memoryLoading: boolean

  // Memory users & stats
  memoryUsers: readonly MemoryUserEntry[]
  memoryStats: MemoryStats | null

  // Brain config
  brainConfig: BrainConfig | null
  brainConfigLoading: boolean

  // Conversations
  userConversations: readonly ConversationTurn[]
  recentConversations: readonly ConversationTurn[]
  conversationsLoading: boolean

  // Selected turn for reasoning inspector
  selectedTurnId: number | null

  // Search
  searchQuery: string

  // Error
  error: string | null

  // Actions
  fetchUserMemory: (platform: Platform, userId: string) => Promise<void>
  fetchUserConversations: (platform: Platform, userId: string, limit?: number) => Promise<void>
  clearUserMemory: (platform: Platform, userId: string) => Promise<void>
  fetchRecentConversations: (limit?: number) => Promise<void>
  setSelectedTurnId: (id: number | null) => void
  setSearchQuery: (query: string) => void

  // New actions
  fetchMemoryUsers: (limit?: number, offset?: number, sortBy?: 'interactions' | 'lastSeen') => Promise<void>
  fetchMemoryStats: () => Promise<void>
  updateFacts: (platform: Platform, userId: string, facts: readonly string[]) => Promise<void>
  updateSummary: (platform: Platform, userId: string, summary: string) => Promise<void>
  deleteTurns: (ids: readonly number[]) => Promise<void>
  runCompaction: () => Promise<{ compacted: number } | null>
  fetchBrainConfig: () => Promise<void>
  updateBrainConfig: (partial: Partial<BrainConfig>) => Promise<void>
}

export const useAgentBrainStore = create<AgentBrainState>((set, get) => ({
  selectedMemory: null,
  memoryLoading: false,
  memoryUsers: [],
  memoryStats: null,
  brainConfig: null,
  brainConfigLoading: false,
  userConversations: [],
  recentConversations: [],
  conversationsLoading: false,
  selectedTurnId: null,
  searchQuery: '',
  error: null,

  fetchUserMemory: async (platform, userId) => {
    set({ memoryLoading: true, error: null })
    try {
      const result = await window.api.invoke('agent:getUserMemory', { platform, userId })
      if (result.success) {
        set({ selectedMemory: result.data, memoryLoading: false })
      } else {
        set({ error: result.error, memoryLoading: false })
      }
    } catch (err) {
      set({ memoryLoading: false, error: err instanceof Error ? err.message : 'Failed to load memory' })
    }
  },

  fetchUserConversations: async (platform, userId, limit = 30) => {
    set({ conversationsLoading: true })
    try {
      const result = await window.api.invoke('agent:getUserConversations', {
        platform,
        userId,
        limit
      })
      if (result.success) {
        set({ userConversations: result.data, conversationsLoading: false })
      } else {
        set({ error: result.error, conversationsLoading: false })
      }
    } catch (err) {
      set({ conversationsLoading: false, error: err instanceof Error ? err.message : 'Failed to load conversations' })
    }
  },

  clearUserMemory: async (platform, userId) => {
    try {
      const result = await window.api.invoke('agent:clearUserMemory', { platform, userId })
      if (result.success) {
        // Only clear UI state if the cleared user matches the selected one
        const selected = get().selectedMemory
        if (selected?.platform === platform && selected?.platformUserId === userId) {
          set({ selectedMemory: null, userConversations: [] })
        }
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to clear memory' })
    }
  },

  fetchRecentConversations: async (limit = 30) => {
    set({ conversationsLoading: true })
    try {
      const result = await window.api.invoke('agent:getRecentConversations', { limit })
      if (result.success) {
        set({ recentConversations: result.data, conversationsLoading: false })
      } else {
        set({ error: result.error, conversationsLoading: false })
      }
    } catch (err) {
      set({ conversationsLoading: false, error: err instanceof Error ? err.message : 'Failed to load conversations' })
    }
  },

  setSelectedTurnId: (id) => set({ selectedTurnId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchMemoryUsers: async (limit = 50, offset = 0, sortBy = 'lastSeen') => {
    try {
      const result = await window.api.invoke('agent:listMemoryUsers', { limit, offset, sortBy })
      if (result.success) {
        set({ memoryUsers: result.data })
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to load memory users' })
    }
  },

  fetchMemoryStats: async () => {
    try {
      const result = await window.api.invoke('agent:getMemoryStats', undefined)
      if (result.success) {
        set({ memoryStats: result.data })
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to load memory stats' })
    }
  },

  updateFacts: async (platform, userId, facts) => {
    try {
      const result = await window.api.invoke('agent:updateFacts', { platform, userId, facts })
      if (result.success) {
        await get().fetchUserMemory(platform, userId)
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to update facts' })
    }
  },

  updateSummary: async (platform, userId, summary) => {
    try {
      const result = await window.api.invoke('agent:updateSummary', { platform, userId, summary })
      if (result.success) {
        await get().fetchUserMemory(platform, userId)
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to update summary' })
    }
  },

  deleteTurns: async (ids) => {
    try {
      const result = await window.api.invoke('agent:deleteTurns', { ids })
      if (result.success) {
        const selected = get().selectedMemory
        if (selected) {
          await get().fetchUserConversations(selected.platform, selected.platformUserId)
        } else {
          await get().fetchRecentConversations()
        }
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to delete turns' })
    }
  },

  runCompaction: async () => {
    try {
      const result = await window.api.invoke('agent:runCompaction', undefined)
      if (result.success) {
        await get().fetchMemoryStats()
        return result.data
      } else {
        set({ error: result.error })
        return null
      }
    } catch {
      set({ error: 'Failed to run compaction' })
      return null
    }
  },

  fetchBrainConfig: async () => {
    set({ brainConfigLoading: true })
    try {
      const result = await window.api.invoke('agent:getBrainConfig', undefined)
      if (result.success) {
        set({ brainConfig: result.data, brainConfigLoading: false })
      } else {
        set({ error: result.error, brainConfigLoading: false })
      }
    } catch {
      set({ brainConfigLoading: false, error: 'Failed to load brain config' })
    }
  },

  updateBrainConfig: async (partial) => {
    try {
      const result = await window.api.invoke('agent:updateBrainConfig', partial)
      if (result.success) {
        set({ brainConfig: result.data })
      } else {
        set({ error: result.error })
      }
    } catch {
      set({ error: 'Failed to update brain config' })
    }
  }
}))
