import { create } from 'zustand'
import type {
  ReportConfig,
  ReportData,
  SavedReport,
  MetricCategory,
  ReportPeriod,
  ReportPlatformFilter
} from '@shared/reports-types'

type ReportsView = 'generator' | 'preview' | 'history'

interface ReportsState {
  // View
  view: ReportsView

  // Generator config
  period: ReportPeriod
  platformFilter: ReportPlatformFilter
  selectedMetrics: readonly MetricCategory[]
  customStart: string
  customEnd: string

  // Generated report
  currentReport: SavedReport | null
  generating: boolean

  // History
  reports: readonly SavedReport[]
  historyLoading: boolean

  // Errors
  error: string | null

  // Export
  exporting: boolean

  // Actions
  setView: (view: ReportsView) => void
  setPeriod: (period: ReportPeriod) => void
  setPlatformFilter: (filter: ReportPlatformFilter) => void
  toggleMetric: (metric: MetricCategory) => void
  setCustomRange: (start: string, end: string) => void
  generate: () => Promise<void>
  viewReport: (report: SavedReport) => void
  fetchHistory: () => Promise<void>
  deleteReport: (id: number) => Promise<void>
  loadReport: (id: number) => Promise<void>
  exportPdf: (id: number) => Promise<void>
  clearError: () => void
}

const ALL_METRICS: readonly MetricCategory[] = [
  'growth', 'engagement', 'retention', 'moderation', 'events'
]

export const useReportsStore = create<ReportsState>((set, get) => ({
  view: 'generator',

  period: '30d',
  platformFilter: 'all',
  selectedMetrics: [...ALL_METRICS],
  customStart: '',
  customEnd: '',

  currentReport: null,
  generating: false,

  reports: [],
  historyLoading: false,

  error: null,

  exporting: false,

  setView: (view) => set({ view, error: null }),
  setPeriod: (period) => set({ period }),
  setPlatformFilter: (filter) => set({ platformFilter: filter }),

  toggleMetric: (metric) => {
    const current = get().selectedMetrics
    const has = current.includes(metric)
    if (has && current.length === 1) return // keep at least one
    const updated = has
      ? current.filter((m) => m !== metric)
      : [...current, metric]
    set({ selectedMetrics: updated })
  },

  setCustomRange: (start, end) => set({ customStart: start, customEnd: end }),

  generate: async () => {
    const { period, platformFilter, selectedMetrics, customStart, customEnd } = get()
    set({ generating: true, error: null })

    const config: ReportConfig = {
      period,
      platformFilter,
      metrics: selectedMetrics,
      ...(period === 'custom' && customStart && customEnd
        ? { customRange: { start: customStart, end: customEnd } }
        : {})
    }

    try {
      const result = await window.api.invoke('reports:generate', config)
      if (result.success) {
        set({ currentReport: result.data, generating: false, view: 'preview' })
      } else {
        set({ error: result.error ?? 'Failed to generate report', generating: false })
      }
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Failed to generate report',
        generating: false
      })
    }
  },

  viewReport: (report) => set({ currentReport: report, view: 'preview' }),

  fetchHistory: async () => {
    set({ historyLoading: true, error: null })
    try {
      const result = await window.api.invoke('reports:list')
      if (result.success) {
        set({ reports: result.data, historyLoading: false })
      } else {
        set({ error: result.error ?? 'Failed to load reports', historyLoading: false })
      }
    } catch (err: unknown) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load reports',
        historyLoading: false
      })
    }
  },

  deleteReport: async (id) => {
    try {
      const result = await window.api.invoke('reports:delete', { id })
      if (result.success) {
        if (get().currentReport?.id === id) {
          set({ currentReport: null, view: 'generator' })
        }
        await get().fetchHistory()
      } else {
        set({ error: result.error ?? 'Failed to delete report' })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete report' })
    }
  },

  loadReport: async (id) => {
    try {
      const result = await window.api.invoke('reports:get', { id })
      if (result.success) {
        set({ currentReport: result.data, view: 'preview' })
      } else {
        set({ error: result.error ?? 'Failed to load report' })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load report' })
    }
  },

  exportPdf: async (id) => {
    set({ exporting: true, error: null })
    try {
      const result = await window.api.invoke('reports:exportPDF', { id })
      if (!result.success) {
        set({ error: result.error ?? 'Export failed' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed'
      if (!msg.includes('cancelled')) {
        set({ error: msg })
      }
    } finally {
      set({ exporting: false })
    }
  },

  clearError: () => set({ error: null })
}))
