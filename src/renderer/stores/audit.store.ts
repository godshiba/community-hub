import { create } from 'zustand'
import type {
  AuditLogEntry,
  AuditFilter,
  AuditActionType,
  EscalationChain,
  EscalationChainPayload
} from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

interface AuditState {
  // Audit log
  entries: readonly AuditLogEntry[]
  total: number
  loading: boolean
  error: string | null

  // Filters
  actionType: AuditActionType | undefined
  platform: Platform | undefined
  moderator: string
  targetUsername: string
  dateFrom: string
  dateTo: string
  offset: number
  limit: number

  // Escalation chains
  chains: readonly EscalationChain[]
  chainsLoading: boolean

  // Filter actions
  setActionType: (a: AuditActionType | undefined) => void
  setPlatform: (p: Platform | undefined) => void
  setModerator: (m: string) => void
  setTargetUsername: (t: string) => void
  setDateRange: (from: string, to: string) => void
  setOffset: (o: number) => void

  // Data actions
  fetchAuditLog: () => Promise<void>
  exportCsv: () => Promise<string | null>
  fetchChains: () => Promise<void>
  saveChain: (payload: EscalationChainPayload & { id?: number }) => Promise<void>
  deleteChain: (id: number) => Promise<void>
  toggleChain: (id: number, enabled: boolean) => Promise<void>
}

function buildFilter(state: AuditState): AuditFilter {
  return {
    actionType: state.actionType,
    platform: state.platform,
    moderator: state.moderator || undefined,
    targetUsername: state.targetUsername || undefined,
    dateFrom: state.dateFrom || undefined,
    dateTo: state.dateTo || undefined,
    limit: state.limit,
    offset: state.offset
  }
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  total: 0,
  loading: false,
  error: null,

  actionType: undefined,
  platform: undefined,
  moderator: '',
  targetUsername: '',
  dateFrom: '',
  dateTo: '',
  offset: 0,
  limit: 50,

  chains: [],
  chainsLoading: false,

  setActionType: (a) => { set({ actionType: a, offset: 0 }); get().fetchAuditLog() },
  setPlatform: (p) => { set({ platform: p, offset: 0 }); get().fetchAuditLog() },
  setModerator: (m) => { set({ moderator: m, offset: 0 }); get().fetchAuditLog() },
  setTargetUsername: (t) => { set({ targetUsername: t, offset: 0 }); get().fetchAuditLog() },
  setDateRange: (from, to) => { set({ dateFrom: from, dateTo: to, offset: 0 }); get().fetchAuditLog() },
  setOffset: (o) => { set({ offset: o }); get().fetchAuditLog() },

  fetchAuditLog: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('moderation:getAuditLog', buildFilter(get()))
      if (result.success) {
        set({ entries: result.data.entries, total: result.data.total, loading: false })
      } else {
        set({ error: result.error ?? 'Failed to load audit log', loading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load audit log', loading: false })
    }
  },

  exportCsv: async () => {
    try {
      const result = await window.api.invoke('moderation:exportAuditLog', buildFilter(get()))
      if (result.success) return result.data.csv
      return null
    } catch {
      return null
    }
  },

  fetchChains: async () => {
    set({ chainsLoading: true })
    try {
      const result = await window.api.invoke('moderation:getEscalationChains', undefined)
      if (result.success) {
        set({ chains: result.data, chainsLoading: false })
      } else {
        set({ chainsLoading: false })
      }
    } catch {
      set({ chainsLoading: false })
    }
  },

  saveChain: async (payload) => {
    const result = await window.api.invoke('moderation:saveEscalationChain', payload)
    if (!result.success) throw new Error(result.error ?? 'Failed to save chain')
    await get().fetchChains()
  },

  deleteChain: async (id) => {
    const result = await window.api.invoke('moderation:deleteEscalationChain', { id })
    if (!result.success) throw new Error(result.error ?? 'Failed to delete chain')
    await get().fetchChains()
  },

  toggleChain: async (id, enabled) => {
    const result = await window.api.invoke('moderation:toggleEscalationChain', { id, enabled })
    if (!result.success) throw new Error(result.error ?? 'Failed to toggle chain')
    await get().fetchChains()
  }
}))
