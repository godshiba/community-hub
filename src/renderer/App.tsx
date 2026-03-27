import { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { IconBar } from '@/components/layout/IconBar'
import { PanelContainer } from '@/components/layout/PanelContainer'
import { StatusBar } from '@/components/layout/StatusBar'
import { usePanelStore } from '@/stores/panel.store'
import type { PanelId } from '@shared/types'

const PANEL_ORDER: PanelId[] = [
  'dashboard', 'agent', 'scheduler', 'moderation', 'events', 'reports', 'settings'
]

export function App(): React.ReactElement {
  const { setActivePanel, goBack, closeSecondary, secondaryPanel } = usePanelStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key >= '1' && e.key <= '7') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        setActivePanel(PANEL_ORDER[index])
      }

      if (mod && e.key === '[') {
        e.preventDefault()
        goBack()
      }

      if (mod && e.key === '\\') {
        e.preventDefault()
        // Split toggle will be more useful once panels can request secondary
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
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <IconBar />
        <PanelContainer />
      </div>
      <StatusBar />
    </div>
  )
}
