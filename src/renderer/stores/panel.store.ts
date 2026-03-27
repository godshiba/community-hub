import { create } from 'zustand'
import type { PanelId } from '@shared/types'

interface PanelState {
  activePanel: PanelId
  secondaryPanel: PanelId | null
  splitRatio: number
  panelHistory: PanelId[]

  setActivePanel: (id: PanelId) => void
  openSecondary: (id: PanelId) => void
  closeSecondary: () => void
  setSplitRatio: (ratio: number) => void
  goBack: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  activePanel: 'dashboard',
  secondaryPanel: null,
  splitRatio: 0.6,
  panelHistory: [],

  setActivePanel: (id) =>
    set((state) => ({
      activePanel: id,
      secondaryPanel: null,
      panelHistory: [...state.panelHistory.slice(-19), state.activePanel]
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
  }
}))
