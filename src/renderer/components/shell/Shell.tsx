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
  onShortcutsClick: () => void
}

export function Shell({ onSearchClick, onShortcutsClick }: ShellProps): React.ReactElement {
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
      switch (action.type) {
        case 'navigate':
          if (action.payload) setActivePanel(action.payload as PanelId)
          break
        case 'toggleSidebar':
          toggleSidebar()
          break
        case 'toggleInspector':
          toggleInspector(activePanel)
          break
        case 'openCommandPalette':
          onSearchClick()
          break
        case 'openShortcutsSheet':
          onShortcutsClick()
          break
        case 'newPost':
          setActivePanel('scheduler')
          window.dispatchEvent(new CustomEvent('panel:newPost'))
          break
        case 'newEvent':
          setActivePanel('events')
          window.dispatchEvent(new CustomEvent('panel:newEvent'))
          break
        case 'generateReport':
          setActivePanel('reports')
          break
        case 'syncNow':
          window.api.invoke('moderation:syncMembers', undefined).catch(() => {/* best-effort */})
          break
        case 'focusSearch':
          window.dispatchEvent(new CustomEvent('panel:focusSearch'))
          break
      }
    })
    return unsub
  }, [activePanel, setActivePanel, toggleSidebar, toggleInspector, onSearchClick, onShortcutsClick])

  // ⌘1..⌘7 panel navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key >= '1' && e.key <= '7') {
        e.preventDefault()
        const target = PANEL_ORDER[parseInt(e.key) - 1]
        if (target) setActivePanel(target)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setActivePanel])

  // Shell-level shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey

      // ⌘B — Toggle sidebar
      if (mod && !e.altKey && !e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }
      // ⌥⌘I — Toggle inspector
      if (mod && e.altKey && !e.shiftKey && e.key === 'i') {
        e.preventDefault()
        toggleInspector(activePanel)
        return
      }
      // ⌘K — Command palette
      if (mod && !e.altKey && !e.shiftKey && e.key === 'k') {
        e.preventDefault()
        onSearchClick()
        return
      }
      // ⌘/ — Keyboard shortcuts sheet
      if (mod && !e.altKey && !e.shiftKey && e.key === '/') {
        e.preventDefault()
        onShortcutsClick()
        return
      }
      // ⌘N — New post (navigate to Scheduler + open editor)
      if (mod && !e.altKey && !e.shiftKey && e.key === 'n') {
        e.preventDefault()
        setActivePanel('scheduler')
        window.dispatchEvent(new CustomEvent('panel:newPost'))
        return
      }
      // ⇧⌘N — New event (navigate to Events + open form)
      if (mod && !e.altKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setActivePanel('events')
        window.dispatchEvent(new CustomEvent('panel:newEvent'))
        return
      }
      // ⌘R — Generate report (navigate to Reports)
      if (mod && !e.altKey && !e.shiftKey && e.key === 'r') {
        e.preventDefault()
        setActivePanel('reports')
        return
      }
      // ⌥⌘S — Sync now
      if (mod && e.altKey && !e.shiftKey && e.key === 's') {
        e.preventDefault()
        window.api.invoke('moderation:syncMembers', undefined).catch(() => {/* best-effort */})
        return
      }
      // ⌘F — Focus search in current panel
      if (mod && !e.altKey && !e.shiftKey && e.key === 'f') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('panel:focusSearch'))
        return
      }
      // ⌘A — Select all rows (panels handle this via panel:selectAll)
      if (mod && !e.altKey && !e.shiftKey && e.key === 'a') {
        // Only intercept when a list has focus; otherwise let browser default
        const active = document.activeElement
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
        if (!isInput) {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('panel:selectAll'))
        }
        return
      }
      // ⇧⌘A — Deselect all rows
      if (mod && !e.altKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('panel:deselectAll'))
        return
      }
      // ⌘↵ — Open detail takeover for selected row
      if (mod && !e.altKey && !e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('panel:openDetail'))
        return
      }
      // ⌃↵ — Open context menu on focused row
      if (e.ctrlKey && !e.metaKey && !e.altKey && e.key === 'Enter') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('panel:openContextMenu'))
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePanel, toggleSidebar, toggleInspector, onSearchClick, onShortcutsClick, setActivePanel])

  const ActivePanel = PANEL_REGISTRY[activePanel]

  return (
    <ToastProvider>
      <ToolbarContext.Provider value={toolbarStore}>
        <div className="h-screen w-screen flex flex-col overflow-hidden">
          <Toolbar onSearchClick={onSearchClick} isFullscreen={isFullscreen} />

          <div className="flex flex-1 overflow-hidden">
            <SourceList />

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
