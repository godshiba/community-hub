import { create } from 'zustand'
import type { AnalyticsData, AnalyticsPeriod, PeriodRange } from '@shared/analytics-types'

interface AnalyticsState {
  data: AnalyticsData | null
  period: AnalyticsPeriod
  customRange: PeriodRange | null
  loading: boolean
  error: string | null

  setPeriod: (period: AnalyticsPeriod) => void
  setCustomRange: (range: PeriodRange) => void
  fetchStats: () => Promise<void>
  syncNow: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  data: null,
  period: 'week',
  customRange: null,
  loading: false,
  error: null,

  setPeriod: (period) => {
    set({ period })
    get().fetchStats()
  },

  setCustomRange: (range) => {
    set({ customRange: range, period: 'custom' })
    get().fetchStats()
  },

  fetchStats: async () => {
    const { period, customRange } = get()
    set({ loading: true, error: null })

    try {
      const result = await window.api.invoke('analytics:getStats', {
        period,
        range: period === 'custom' && customRange ? customRange : undefined
      })

      if (result.success) {
        set({ data: result.data, loading: false })
      } else {
        set({ error: result.error ?? 'Failed to fetch stats', loading: false })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats'
      set({ error: message, loading: false })
    }
  },

  syncNow: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('analytics:syncNow')
      if (!result.success) {
        set({ error: result.error ?? 'Sync failed', loading: false })
        return
      }
      await get().fetchStats()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      set({ error: message, loading: false })
    }
  }
}))
