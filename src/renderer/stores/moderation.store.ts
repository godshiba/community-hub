import { create } from 'zustand'
import type {
  CommunityMember,
  MemberDetail,
  MembersFilter,
  MemberStatus
} from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

interface ModerationState {
  members: readonly CommunityMember[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null

  // Filters
  platform: Platform | undefined
  status: MemberStatus | undefined
  search: string
  sortBy: MembersFilter['sortBy']
  sortDir: MembersFilter['sortDir']

  // Detail panel
  selectedMember: MemberDetail | null
  detailLoading: boolean

  // Actions
  setPlatform: (p: Platform | undefined) => void
  setStatus: (s: MemberStatus | undefined) => void
  setSearch: (q: string) => void
  setSort: (by: MembersFilter['sortBy'], dir: MembersFilter['sortDir']) => void
  setPage: (p: number) => void
  fetchMembers: () => Promise<void>
  fetchMemberDetail: (id: number) => Promise<void>
  clearDetail: () => void
  warnMember: (memberId: number, reason: string) => Promise<void>
  banMember: (memberId: number, reason: string) => Promise<void>
  unbanMember: (memberId: number) => Promise<void>
  updateNotes: (memberId: number, notes: string) => Promise<void>
  syncMembers: () => Promise<number>
  exportCsv: () => Promise<string | null>
}

function buildFilter(state: ModerationState): MembersFilter {
  return {
    platform: state.platform,
    status: state.status,
    search: state.search || undefined,
    page: state.page,
    pageSize: state.pageSize,
    sortBy: state.sortBy,
    sortDir: state.sortDir
  }
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  members: [],
  total: 0,
  page: 1,
  pageSize: 50,
  loading: false,
  error: null,

  platform: undefined,
  status: undefined,
  search: '',
  sortBy: 'username',
  sortDir: 'asc',

  selectedMember: null,
  detailLoading: false,

  setPlatform: (p) => { set({ platform: p, page: 1 }); get().fetchMembers() },
  setStatus: (s) => { set({ status: s, page: 1 }); get().fetchMembers() },
  setSearch: (q) => { set({ search: q, page: 1 }); get().fetchMembers() },
  setSort: (by, dir) => { set({ sortBy: by, sortDir: dir }); get().fetchMembers() },
  setPage: (p) => { set({ page: p }); get().fetchMembers() },

  fetchMembers: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('moderation:getMembers', buildFilter(get()))
      if (result.success) {
        set({ members: result.data.members, total: result.data.total, loading: false })
      } else {
        set({ error: result.error ?? 'Failed to load members', loading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load members', loading: false })
    }
  },

  fetchMemberDetail: async (id) => {
    set({ detailLoading: true })
    try {
      const result = await window.api.invoke('moderation:getMemberDetail', { id })
      if (result.success) {
        set({ selectedMember: result.data, detailLoading: false })
      } else {
        set({ detailLoading: false })
      }
    } catch {
      set({ detailLoading: false })
    }
  },

  clearDetail: () => set({ selectedMember: null }),

  warnMember: async (memberId, reason) => {
    const result = await window.api.invoke('moderation:warnUser', { memberId, reason })
    if (!result.success) throw new Error(result.error ?? 'Failed to warn')
    await get().fetchMembers()
    if (get().selectedMember?.member.id === memberId) {
      await get().fetchMemberDetail(memberId)
    }
  },

  banMember: async (memberId, reason) => {
    const result = await window.api.invoke('moderation:banUser', { memberId, reason })
    if (!result.success) throw new Error(result.error ?? 'Failed to ban')
    await get().fetchMembers()
    if (get().selectedMember?.member.id === memberId) {
      await get().fetchMemberDetail(memberId)
    }
  },

  unbanMember: async (memberId) => {
    const result = await window.api.invoke('moderation:unbanUser', { id: memberId })
    if (!result.success) throw new Error(result.error ?? 'Failed to unban')
    await get().fetchMembers()
    if (get().selectedMember?.member.id === memberId) {
      await get().fetchMemberDetail(memberId)
    }
  },

  updateNotes: async (memberId, notes) => {
    const result = await window.api.invoke('moderation:updateNotes', { memberId, notes })
    if (!result.success) throw new Error(result.error ?? 'Failed to update notes')
    if (get().selectedMember?.member.id === memberId) {
      await get().fetchMemberDetail(memberId)
    }
  },

  syncMembers: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('moderation:syncMembers', undefined)
      if (result.success) {
        await get().fetchMembers()
        return result.data.synced
      }
      set({ error: result.error ?? 'Sync failed', loading: false })
      return 0
    } catch {
      set({ loading: false })
      return 0
    }
  },

  exportCsv: async () => {
    try {
      const result = await window.api.invoke('moderation:exportMembers', buildFilter(get()))
      if (result.success) return result.data.csv
      return null
    } catch {
      return null
    }
  }
}))
