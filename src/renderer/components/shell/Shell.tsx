import { useEffect, useRef, useState } from 'react'
import { PANEL_REGISTRY } from '@/panels/registry'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { usePanelStore } from '@/stores/panel.store'
import { useShellStore } from '@/stores/shell.store'
import { ToastProvider, ToastViewport, Toast } from '@/components/ui-native/Toast'
import { useToastStore } from '@/stores/toast.store'
import { Toolbar } from './Toolbar'
import { SourceList } from './SourceList'
import { Inspector } from './Inspector'
import { ToolbarContext, createToolbarStore } from './toolbarContext'
import type { PanelId } from '@shared/types'
import type { MenuAction } from '@shared/system-types'

const PANEL_ORDER: PanelId[] = [
  'dashboard', 'moderation', 'events', 'scheduler', 'agent', 'reports', 'settings'
]

interface ShellProps {
  onSearchClick: () => void
}

export function Shell({ onSearchClick }: ShellProps): React.ReactElement {
  const toolbarStore = useRef(createToolbarStore()).current
  const { activePanel, setActivePanel } = usePanelStore()
  const { toggleSidebar, toggleInspector } = useShellStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismiss)

  // Fullscreen state from main process
  useEffect(() => {
    const unsub = window.api.on('system:fullscreenChanged', (fs) => {
      setIsFullscreen(fs)
    })
    return unsub
  }, [])

  // Menu bar → renderer actions
  useEffect(() => {
    const unsub = window.api.on('menu:action', (action: MenuAction) => {
      if (action.type === 'navigate' && action.payload) {
        setActivePanel(action.payload as PanelId)
      } else if (action.type === 'toggleSidebar') {
        toggleSidebar()
      } else if (action.type === 'toggleInspector') {
        toggleInspector(activePanel)
      } else if (action.type === 'openCommandPalette') {
        onSearchClick()
      }
    })
    return unsub
  }, [activePanel, setActivePanel, toggleSidebar, toggleInspector, onSearchClick])

  // ⌘1..⌘7 panel navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key >= '1' && e.key <= '7') {
        e.preventDefault()
        const idx = parseInt(e.key) - 1
        const target = PANEL_ORDER[idx]
        if (target) setActivePanel(target)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setActivePanel])

  // ⌘B sidebar, ⌥⌘I inspector
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'b') { e.preventDefault(); toggleSidebar() }
      if (mod && e.altKey && e.key === 'i') { e.preventDefault(); toggleInspector(activePanel) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePanel, toggleSidebar, toggleInspector])

  const ActivePanel = PANEL_REGISTRY[activePanel]

  return (
    <ToastProvider>
      <ToolbarContext.Provider value={toolbarStore}>
        <div className="h-screen w-screen flex flex-col overflow-hidden">
          <Toolbar onSearchClick={onSearchClick} isFullscreen={isFullscreen} />

          <div className="flex flex-1 overflow-hidden">
            <SourceList />

            {/* Main content area */}
            <div
              key={activePanel}
              className="flex-1 overflow-y-auto overflow-x-hidden"
            >
              <ErrorBoundary panelName={activePanel}>
                <ActivePanel />
              </ErrorBoundary>
            </div>

            <Inspector />
          </div>
        </div>

        {/* Toast stack */}
        <ToastViewport />
        {toasts.map((t) => (
          <Toast
            key={t.id}
            open
            onOpenChange={(open) => { if (!open) dismissToast(t.id) }}
            variant={t.variant}
            title={t.title}
            description={t.description}
            durationMs={t.duration}
          />
        ))}
      </ToolbarContext.Provider>
    </ToastProvider>
  )
}
