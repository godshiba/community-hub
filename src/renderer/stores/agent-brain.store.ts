import { create } from 'zustand'
import type { UserMemory, ConversationTurn } from '@shared/agent-brain-types'
import type { Platform } from '@shared/settings-types'

interface AgentBrainState {
  // User memory
  selectedMemory: UserMemory | null
  memoryLoading: boolean

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
}

export const useAgentBrainStore = create<AgentBrainState>((set, get) => ({
  selectedMemory: null,
  memoryLoading: false,
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
  setSearchQuery: (query) => set({ searchQuery: query })
}))
