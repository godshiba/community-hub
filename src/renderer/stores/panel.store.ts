import { create } from 'zustand'
import type { PanelId } from '@shared/types'

const PANEL_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  agent: 'Agent Terminal',
  scheduler: 'Scheduler',
  moderation: 'Moderation',
  events: 'Events',
  reports: 'Reports',
  settings: 'Settings'
}

interface PanelState {
  activePanel: PanelId
  secondaryPanel: PanelId | null
  splitRatio: number
  panelHistory: PanelId[]
  sidebarCollapsed: boolean
  breadcrumbs: string[]

  setActivePanel: (id: PanelId) => void
  openSecondary: (id: PanelId) => void
  closeSecondary: () => void
  setSplitRatio: (ratio: number) => void
  goBack: () => void
  toggleSidebar: () => void
  setBreadcrumbs: (crumbs: string[]) => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  activePanel: 'dashboard',
  secondaryPanel: null,
  splitRatio: 0.6,
  panelHistory: [],
  sidebarCollapsed: false,
  breadcrumbs: ['Dashboard'],

  setActivePanel: (id) =>
    set((state) => ({
      activePanel: id,
      secondaryPanel: null,
      panelHistory: [...state.panelHistory.slice(-19), state.activePanel],
      breadcrumbs: [PANEL_LABELS[id] ?? id]
    })),

  openSecondary: (id) =>
    set({ secondaryPanel: id }),

  closeSecondary: () =>
    set({ secondaryPanel: null }),

  setSplitRatio: (ratio) =>
    set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) }),

  goBack: () => {
    const history = get().panelHistory
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({
      activePanel: prev,
      secondaryPanel: null,
      panelHistory: history.slice(0, -1)
    })
  },

  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setBreadcrumbs: (crumbs) =>
    set({ breadcrumbs: crumbs })
}))
