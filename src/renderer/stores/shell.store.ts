import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PanelId } from '@shared/types'

interface ShellState {
  sidebarWidth: number
  sidebarVisible: boolean
  inspectorOpenByPanel: Partial<Record<PanelId, boolean>>
  lastActivePanel: PanelId
  scrollTopByPanel: Partial<Record<PanelId, number>>
  recentCommands: string[]

  setSidebarWidth: (width: number) => void
  setSidebarVisible: (visible: boolean) => void
  toggleSidebar: () => void
  setInspectorOpen: (panelId: PanelId, open: boolean) => void
  toggleInspector: (panelId: PanelId) => void
  setLastActivePanel: (panelId: PanelId) => void
  setScrollTop: (panelId: PanelId, top: number) => void
  addRecentCommand: (command: string) => void
}

export const useShellStore = create<ShellState>()(
  persist(
    (set, get) => ({
      sidebarWidth: 220,
      sidebarVisible: true,
      inspectorOpenByPanel: {},
      lastActivePanel: 'dashboard',
      scrollTopByPanel: {},
      recentCommands: [],

      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(200, Math.min(320, width)) }),

      setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

      toggleSidebar: () =>
        set((s) => ({ sidebarVisible: !s.sidebarVisible })),

      setInspectorOpen: (panelId, open) =>
        set((s) => ({
          inspectorOpenByPanel: { ...s.inspectorOpenByPanel, [panelId]: open }
        })),

      toggleInspector: (panelId) => {
        const current = get().inspectorOpenByPanel[panelId] ?? false
        set((s) => ({
          inspectorOpenByPanel: { ...s.inspectorOpenByPanel, [panelId]: !current }
        }))
      },

      setLastActivePanel: (panelId) => set({ lastActivePanel: panelId }),

      setScrollTop: (panelId, top) =>
        set((s) => ({
          scrollTopByPanel: { ...s.scrollTopByPanel, [panelId]: top }
        })),

      addRecentCommand: (command) =>
        set((s) => ({
          recentCommands: [command, ...s.recentCommands.filter((c) => c !== command)].slice(0, 5)
        }))
    }),
    {
      name: 'community-hub-shell',
      version: 1
    }
  )
)
