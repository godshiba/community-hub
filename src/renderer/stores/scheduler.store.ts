import { create } from 'zustand'
import type {
  ScheduledPost,
  PostPayload,
  PostHistoryEntry,
  ChannelInfo
} from '@shared/scheduler-types'

type Tab = 'queue' | 'history'

interface SchedulerState {
  queue: readonly ScheduledPost[]
  history: readonly PostHistoryEntry[]
  channels: readonly ChannelInfo[]
  tab: Tab
  loading: boolean
  error: string | null

  setTab: (tab: Tab) => void
  fetchQueue: () => Promise<void>
  fetchHistory: () => Promise<void>
  fetchChannels: () => Promise<void>
  createPost: (payload: PostPayload) => Promise<ScheduledPost | null>
  updatePost: (id: number, payload: PostPayload) => Promise<ScheduledPost | null>
  cancelPost: (id: number) => Promise<void>
  sendNow: (id: number) => Promise<void>
}

export const useSchedulerStore = create<SchedulerState>((set, get) => ({
  queue: [],
  history: [],
  channels: [],
  tab: 'queue',
  loading: false,
  error: null,

  setTab: (tab) => {
    set({ tab })
    if (tab === 'history') get().fetchHistory()
  },

  fetchQueue: async () => {
    try {
      const result = await window.api.invoke('scheduler:getQueue')
      if (result.success) set({ queue: result.data })
    } catch { /* ignore */ }
  },

  fetchHistory: async () => {
    try {
      const result = await window.api.invoke('scheduler:getHistory')
      if (result.success) set({ history: result.data })
    } catch { /* ignore */ }
  },

  fetchChannels: async () => {
    try {
      const result = await window.api.invoke('scheduler:getChannels')
      if (result.success) set({ channels: result.data })
    } catch { /* ignore */ }
  },

  createPost: async (payload) => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('scheduler:createPost', payload)
      if (result.success) {
        await get().fetchQueue()
        set({ loading: false })
        return result.data
      }
      set({ error: result.error ?? 'Failed to create post', loading: false })
      return null
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to create post', loading: false })
      return null
    }
  },

  updatePost: async (id, payload) => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('scheduler:updatePost', { id, ...payload })
      if (result.success) {
        await get().fetchQueue()
        set({ loading: false })
        return result.data
      }
      set({ error: result.error ?? 'Failed to update post', loading: false })
      return null
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to update post', loading: false })
      return null
    }
  },

  cancelPost: async (id) => {
    try {
      await window.api.invoke('scheduler:cancelPost', { id })
      await get().fetchQueue()
    } catch { /* ignore */ }
  },

  sendNow: async (id) => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('scheduler:sendNow', { id })
      if (!result.success) {
        set({ error: result.error ?? 'Send failed', loading: false })
        return
      }
      await get().fetchQueue()
      await get().fetchHistory()
      set({ loading: false })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Send failed', loading: false })
    }
  }
}))
