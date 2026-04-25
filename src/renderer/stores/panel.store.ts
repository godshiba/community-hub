import { create } from 'zustand'
import type { PanelId } from '@shared/types'

interface PanelState {
  activePanel: PanelId
  panelHistory: PanelId[]

  setActivePanel: (id: PanelId) => void
  goBack: () => void
}

export const usePanelStore = create<PanelState>((set, get) => ({
  activePanel: 'dashboard',
  panelHistory: [],

  setActivePanel: (id) =>
    set((state) => ({
      activePanel: id,
      panelHistory: [...state.panelHistory.slice(-19), state.activePanel]
    })),

  goBack: () => {
    const history = get().panelHistory
    if (history.length === 0) return
    const prev = history[history.length - 1]
    set({
      activePanel: prev,
      panelHistory: history.slice(0, -1)
    })
  }
}))
