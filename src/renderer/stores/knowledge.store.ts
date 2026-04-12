import { create } from 'zustand'
import type {
  KnowledgeEntry,
  KnowledgeEntryPayload,
  KnowledgeCategory,
  KnowledgeCategoryPayload,
  KnowledgeSearchResult,
  KnowledgeImportResult,
  ChannelAgentConfig,
  ChannelAgentConfigPayload
} from '@shared/knowledge-types'

interface KnowledgeState {
  // Entries
  entries: readonly KnowledgeEntry[]
  entriesLoading: boolean

  // Categories
  categories: readonly KnowledgeCategory[]

  // Search
  searchResults: readonly KnowledgeSearchResult[]
  searchQuery: string
  searchLoading: boolean

  // Channel configs
  channelConfigs: readonly ChannelAgentConfig[]

  // Filter
  filterCategoryId: number | undefined

  // Error
  error: string | null

  // Actions — Entries
  fetchEntries: (filter?: { categoryId?: number; platformScope?: string }) => Promise<void>
  createEntry: (payload: KnowledgeEntryPayload) => Promise<void>
  updateEntry: (id: number, payload: KnowledgeEntryPayload) => Promise<void>
  deleteEntry: (id: number) => Promise<void>
  importEntries: (entries: readonly { title: string; content: string; categoryId?: number | null; tags?: readonly string[] }[]) => Promise<KnowledgeImportResult>

  // Actions — Search
  search: (query: string) => Promise<void>
  clearSearch: () => void

  // Actions — Categories
  fetchCategories: () => Promise<void>
  createCategory: (payload: KnowledgeCategoryPayload) => Promise<void>
  updateCategory: (id: number, payload: KnowledgeCategoryPayload) => Promise<void>
  deleteCategory: (id: number) => Promise<void>

  // Actions — Channel Config
  fetchChannelConfigs: () => Promise<void>
  updateChannelConfig: (payload: ChannelAgentConfigPayload) => Promise<void>
  deleteChannelConfig: (id: number) => Promise<void>

  // Filter
  setFilterCategoryId: (id: number | undefined) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  entries: [],
  entriesLoading: false,
  categories: [],
  searchResults: [],
  searchQuery: '',
  searchLoading: false,
  channelConfigs: [],
  filterCategoryId: undefined,
  error: null,

  fetchEntries: async (filter) => {
    set({ entriesLoading: true })
    try {
      const result = await window.api.invoke('knowledge:getEntries', filter ?? undefined)
      if (result.success) {
        set({ entries: result.data, entriesLoading: false })
      } else {
        set({ error: result.error, entriesLoading: false })
      }
    } catch {
      set({ entriesLoading: false })
    }
  },

  createEntry: async (payload) => {
    const result = await window.api.invoke('knowledge:createEntry', payload)
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchEntries(
      get().filterCategoryId ? { categoryId: get().filterCategoryId } : undefined
    )
    get().fetchCategories()
  },

  updateEntry: async (id, payload) => {
    const result = await window.api.invoke('knowledge:updateEntry', { id, ...payload })
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchEntries(
      get().filterCategoryId ? { categoryId: get().filterCategoryId } : undefined
    )
  },

  deleteEntry: async (id) => {
    const result = await window.api.invoke('knowledge:deleteEntry', { id })
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchEntries(
      get().filterCategoryId ? { categoryId: get().filterCategoryId } : undefined
    )
    get().fetchCategories()
  },

  importEntries: async (entries) => {
    const result = await window.api.invoke('knowledge:import', { entries })
    if (result.success) {
      get().fetchEntries()
      get().fetchCategories()
      return result.data
    }
    set({ error: result.error })
    return { imported: 0, failed: entries.length, errors: [result.error] }
  },

  search: async (query) => {
    set({ searchQuery: query, searchLoading: true })
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false })
      return
    }
    try {
      const result = await window.api.invoke('knowledge:search', {
        query,
        categoryId: get().filterCategoryId,
        limit: 20
      })
      if (result.success) {
        set({ searchResults: result.data, searchLoading: false })
      } else {
        set({ error: result.error, searchLoading: false })
      }
    } catch {
      set({ searchLoading: false })
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] })
  },

  fetchCategories: async () => {
    try {
      const result = await window.api.invoke('knowledge:getCategories')
      if (result.success) {
        set({ categories: result.data })
      }
    } catch { /* ignore */ }
  },

  createCategory: async (payload) => {
    const result = await window.api.invoke('knowledge:createCategory', payload)
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchCategories()
  },

  updateCategory: async (id, payload) => {
    const result = await window.api.invoke('knowledge:updateCategory', { id, ...payload })
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchCategories()
  },

  deleteCategory: async (id) => {
    const result = await window.api.invoke('knowledge:deleteCategory', { id })
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchCategories()
    get().fetchEntries()
  },

  fetchChannelConfigs: async () => {
    try {
      const result = await window.api.invoke('knowledge:getChannelConfigs')
      if (result.success) {
        set({ channelConfigs: result.data })
      }
    } catch { /* ignore */ }
  },

  updateChannelConfig: async (payload) => {
    const result = await window.api.invoke('knowledge:updateChannelConfig', payload)
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchChannelConfigs()
  },

  deleteChannelConfig: async (id) => {
    const result = await window.api.invoke('knowledge:deleteChannelConfig', { id })
    if (!result.success) {
      set({ error: result.error })
      return
    }
    get().fetchChannelConfigs()
  },

  setFilterCategoryId: (id) => {
    set({ filterCategoryId: id })
    get().fetchEntries(id ? { categoryId: id } : undefined)
  }
}))
