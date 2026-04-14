import { create } from 'zustand'
import type {
  AgentStatus,
  AgentAction,
  AgentActionsFilter,
  AgentProfile,
  AgentProfilePayload,
  AgentPattern,
  AgentPatternPayload,
  AgentAutomation,
  AgentAutomationPayload,
  AgentActionType,
  AgentActionStatus
} from '@shared/agent-types'
import type { Platform } from '@shared/settings-types'

interface AgentState {
  // Status
  status: AgentStatus | null
  statusLoading: boolean

  // Actions feed
  actions: readonly AgentAction[]
  actionsLoading: boolean

  // Filters
  filterType: AgentActionType | undefined
  filterPlatform: Platform | undefined
  filterStatus: AgentActionStatus | undefined

  // Profile
  profile: AgentProfile | null

  // Patterns
  patterns: readonly AgentPattern[]

  // Automations
  automations: readonly AgentAutomation[]

  // Error
  error: string | null

  // Actions
  fetchStatus: () => Promise<void>
  fetchActions: () => Promise<void>
  setFilterType: (type: AgentActionType | undefined) => void
  setFilterPlatform: (platform: Platform | undefined) => void
  setFilterStatus: (status: AgentActionStatus | undefined) => void
  approveAction: (id: number) => Promise<void>
  rejectAction: (id: number) => Promise<void>
  editAction: (id: number, output: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (payload: AgentProfilePayload) => Promise<void>
  fetchPatterns: () => Promise<void>
  savePattern: (payload: AgentPatternPayload) => Promise<void>
  deletePattern: (id: number) => Promise<void>
  fetchAutomations: () => Promise<void>
  saveAutomation: (payload: AgentAutomationPayload) => Promise<void>
  deleteAutomation: (id: number) => Promise<void>
  toggleAutomation: (id: number, enabled: boolean) => Promise<void>
  testProvider: () => Promise<{ success: boolean; error?: string }>
}

export const useAgentStore = create<AgentState>((set, get) => ({
  status: null,
  statusLoading: false,
  actions: [],
  actionsLoading: false,
  filterType: undefined,
  filterPlatform: undefined,
  filterStatus: undefined,
  profile: null,
  patterns: [],
  automations: [],
  error: null,

  fetchStatus: async () => {
    set({ statusLoading: true })
    try {
      const result = await window.api.invoke('agent:getStatus')
      if (result.success) {
        set({ status: result.data, statusLoading: false })
      } else {
        set({ error: result.error, statusLoading: false })
      }
    } catch {
      set({ statusLoading: false })
    }
  },

  fetchActions: async () => {
    const { filterType, filterPlatform, filterStatus } = get()
    set({ actionsLoading: true })
    try {
      const filter: AgentActionsFilter = {
        actionType: filterType,
        platform: filterPlatform,
        status: filterStatus,
        limit: 50
      }
      const result = await window.api.invoke('agent:getActions', filter)
      if (result.success) {
        set({ actions: result.data, actionsLoading: false })
      } else {
        set({ error: result.error, actionsLoading: false })
      }
    } catch {
      set({ actionsLoading: false })
    }
  },

  setFilterType: (type) => {
    set({ filterType: type })
    get().fetchActions()
  },

  setFilterPlatform: (platform) => {
    set({ filterPlatform: platform })
    get().fetchActions()
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status })
    get().fetchActions()
  },

  approveAction: async (id) => {
    const result = await window.api.invoke('agent:approve', { id })
    if (!result.success) set({ error: result.error ?? 'Failed to approve action' })
    await get().fetchActions()
    await get().fetchStatus()
  },

  rejectAction: async (id) => {
    const result = await window.api.invoke('agent:reject', { id })
    if (!result.success) set({ error: result.error ?? 'Failed to reject action' })
    await get().fetchActions()
    await get().fetchStatus()
  },

  editAction: async (id, output) => {
    const result = await window.api.invoke('agent:editAction', { id, output })
    if (!result.success) set({ error: result.error ?? 'Failed to edit action' })
    await get().fetchActions()
  },

  pause: async () => {
    const result = await window.api.invoke('agent:pause')
    if (!result.success) set({ error: result.error ?? 'Failed to pause agent' })
    get().fetchStatus()
  },

  resume: async () => {
    const result = await window.api.invoke('agent:resume')
    if (!result.success) set({ error: result.error ?? 'Failed to resume agent' })
    get().fetchStatus()
  },

  fetchProfile: async () => {
    try {
      const result = await window.api.invoke('agent:getProfile')
      if (result.success) {
        set({ profile: result.data })
      }
    } catch { /* ignore */ }
  },

  updateProfile: async (payload) => {
    const result = await window.api.invoke('agent:updateProfile', payload)
    if (result.success) {
      set({ profile: result.data })
    }
  },

  fetchPatterns: async () => {
    try {
      const result = await window.api.invoke('agent:getPatterns')
      if (result.success) {
        set({ patterns: result.data })
      }
    } catch { /* ignore */ }
  },

  savePattern: async (payload) => {
    const result = await window.api.invoke('agent:savePattern', payload)
    if (!result.success) set({ error: result.error ?? 'Failed to save pattern' })
    await get().fetchPatterns()
  },

  deletePattern: async (id) => {
    const result = await window.api.invoke('agent:deletePattern', { id })
    if (!result.success) set({ error: result.error ?? 'Failed to delete pattern' })
    await get().fetchPatterns()
  },

  fetchAutomations: async () => {
    try {
      const result = await window.api.invoke('agent:getAutomations')
      if (result.success) {
        set({ automations: result.data })
      }
    } catch { /* ignore */ }
  },

  saveAutomation: async (payload) => {
    const result = await window.api.invoke('agent:saveAutomation', payload)
    if (!result.success) set({ error: result.error ?? 'Failed to save automation' })
    await get().fetchAutomations()
  },

  deleteAutomation: async (id) => {
    const result = await window.api.invoke('agent:deleteAutomation', { id })
    if (!result.success) set({ error: result.error ?? 'Failed to delete automation' })
    await get().fetchAutomations()
  },

  toggleAutomation: async (id, enabled) => {
    const result = await window.api.invoke('agent:toggleAutomation', { id, enabled })
    if (!result.success) set({ error: result.error ?? 'Failed to toggle automation' })
    await get().fetchAutomations()
  },

  testProvider: async () => {
    const result = await window.api.invoke('agent:testProvider')
    if (result.success) {
      return result.data
    }
    return { success: false, error: result.error }
  }
}))
