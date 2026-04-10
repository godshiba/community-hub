import { create } from 'zustand'
import type {
  ModerationPolicy,
  ModerationPolicyPayload,
  ContentFlag,
  ContentFlagFilter,
  FlagStatus,
  ContentCategory
} from '@shared/content-moderation-types'
import type { Platform } from '@shared/settings-types'

interface ContentModerationState {
  // Policy
  policy: ModerationPolicy | null
  policyLoading: boolean

  // Flags
  flags: readonly ContentFlag[]
  flagsLoading: boolean
  flagFilter: ContentFlagFilter

  // Actions
  fetchPolicy: () => Promise<void>
  savePolicy: (payload: ModerationPolicyPayload & { id?: number }) => Promise<void>
  fetchFlags: () => Promise<void>
  reviewFlag: (flagId: number, decision: 'approve' | 'dismiss' | 'action') => Promise<void>
  setFlagFilter: (filter: Partial<ContentFlagFilter>) => void
}

export const useContentModerationStore = create<ContentModerationState>((set, get) => ({
  policy: null,
  policyLoading: false,

  flags: [],
  flagsLoading: false,
  flagFilter: {},

  fetchPolicy: async () => {
    set({ policyLoading: true })
    try {
      const result = await window.api.invoke('content-mod:getPolicy', undefined)
      if (result.success) {
        set({ policy: result.data, policyLoading: false })
      } else {
        set({ policyLoading: false })
      }
    } catch {
      set({ policyLoading: false })
    }
  },

  savePolicy: async (payload) => {
    set({ policyLoading: true })
    try {
      const result = await window.api.invoke('content-mod:updatePolicy', payload)
      if (result.success) {
        set({ policy: result.data, policyLoading: false })
      } else {
        set({ policyLoading: false })
        throw new Error(result.error ?? 'Failed to save policy')
      }
    } catch (err) {
      set({ policyLoading: false })
      throw err
    }
  },

  fetchFlags: async () => {
    set({ flagsLoading: true })
    try {
      const result = await window.api.invoke('content-mod:getFlags', get().flagFilter)
      if (result.success) {
        set({ flags: result.data, flagsLoading: false })
      } else {
        set({ flagsLoading: false })
      }
    } catch {
      set({ flagsLoading: false })
    }
  },

  reviewFlag: async (flagId, decision) => {
    const result = await window.api.invoke('content-mod:reviewFlag', { flagId, decision })
    if (!result.success) throw new Error(result.error ?? 'Failed to review flag')
    await get().fetchFlags()
  },

  setFlagFilter: (filter) => {
    set({ flagFilter: { ...get().flagFilter, ...filter } })
    get().fetchFlags()
  }
}))
