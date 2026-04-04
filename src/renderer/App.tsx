import { useEffect, useState } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { PanelContainer } from '@/components/layout/PanelContainer'
import { StatusBar } from '@/components/layout/StatusBar'
import { ToastContainer } from '@/components/shared/ToastContainer'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { usePanelStore } from '@/stores/panel.store'
import { useAgentStore } from '@/stores/agent.store'
import type { PanelId } from '@shared/types'

const PANEL_ORDER: PanelId[] = [
  'dashboard', 'agent', 'scheduler', 'moderation', 'events', 'reports', 'settings'
]

export function App(): React.ReactElement {
  const { setActivePanel, goBack, closeSecondary, secondaryPanel } = usePanelStore()
  const fetchAgentStatus = useAgentStore((s) => s.fetchStatus)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => { fetchAgentStatus() }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((v) => !v)
        return
      }

      if (mod && e.key >= '1' && e.key <= '7') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        setActivePanel(PANEL_ORDER[index])
      }

      if (mod && e.key === '[') {
        e.preventDefault()
        goBack()
      }

      if (mod && e.key === 'b') {
        e.preventDefault()
        usePanelStore.getState().toggleSidebar()
      }

      if (e.key === 'Escape' && secondaryPanel) {
        e.preventDefault()
        closeSecondary()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActivePanel, goBack, closeSecondary, secondaryPanel])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TitleBar onSearchClick={() => setCommandPaletteOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PanelContainer />
      </div>
      <StatusBar />
      <ToastContainer />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  )
}
