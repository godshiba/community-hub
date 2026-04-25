import { useSyncExternalStore, useContext } from 'react'
import { SidebarSimple, MagnifyingGlass } from '@phosphor-icons/react'
import { usePanelStore } from '@/stores/panel.store'
import { useShellStore } from '@/stores/shell.store'
import { ToolbarContext } from './toolbarContext'
import { cn } from '@/lib/utils'

const PANEL_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  agent: 'Agent',
  scheduler: 'Scheduler',
  moderation: 'Moderation',
  events: 'Events',
  reports: 'Reports',
  settings: 'Settings'
}

interface ToolbarProps {
  onSearchClick: () => void
  isFullscreen: boolean
}

export function Toolbar({ onSearchClick, isFullscreen }: ToolbarProps): React.ReactElement {
  const toolbarStore = useContext(ToolbarContext)!
  const config = useSyncExternalStore(
    toolbarStore.subscribe,
    toolbarStore.getConfig,
    toolbarStore.getConfig
  )

  const activePanel = usePanelStore((s) => s.activePanel)
  const { sidebarVisible, toggleSidebar, toggleInspector, inspectorOpenByPanel } = useShellStore()

  const title = config.title ?? PANEL_TITLES[activePanel] ?? activePanel
  const inspectorEnabled = config.inspector?.enabled ?? false
  const inspectorOpen = inspectorOpenByPanel[activePanel] ?? false

  return (
    <div
      className="h-[52px] flex items-center shrink-0 select-none border-b border-[var(--color-divider)]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Traffic light reserve — shrinks to 0 in fullscreen */}
      {!isFullscreen && <div className="w-[68px] shrink-0" />}

      {/* Sidebar toggle */}
      <div
        className="ml-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded transition-colors',
            sidebarVisible
              ? 'text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-secondary)] hover:bg-white/[0.06]'
              : 'text-[var(--color-accent)]'
          )}
          aria-label={sidebarVisible ? 'Collapse sidebar' : 'Expand sidebar'}
          title="Toggle sidebar (⌘B)"
        >
          <SidebarSimple size={18} />
        </button>
      </div>

      {/* Panel title */}
      <span className="ml-2.5 text-[15px] font-semibold text-[var(--color-fg-primary)] truncate max-w-[200px]">
        {title}
      </span>

      {/* Flex spacer — drag region so double-click zooms window */}
      <div className="flex-1" />

      {/* Right-side controls — no-drag */}
      <div
        className="flex items-center gap-1.5 pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Contextual panel actions */}
        {config.actions}

        {/* Search pill */}
        <button
          onClick={onSearchClick}
          className={cn(
            'flex items-center gap-2 h-[30px] pl-2.5 pr-3 w-[260px]',
            'rounded-[var(--radius-md)] bg-black/20 hover:bg-black/30',
            'text-[var(--color-fg-tertiary)] transition-colors',
            'border border-[var(--color-divider)]'
          )}
          aria-label="Open command palette"
          title="Command palette (⌘K)"
        >
          <MagnifyingGlass size={13} />
          <span className="text-[13px] flex-1 text-left">Search...</span>
          <span className="text-[11px] font-medium opacity-60">⌘K</span>
        </button>

        {/* Inspector toggle — only shown when panel declares an inspector */}
        {inspectorEnabled && (
          <button
            onClick={() => toggleInspector(activePanel)}
            className={cn(
              'p-1.5 rounded transition-colors',
              inspectorOpen
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-fill)]'
                : 'text-[var(--color-fg-tertiary)] hover:text-[var(--color-fg-secondary)] hover:bg-white/[0.06]'
            )}
            aria-label="Toggle inspector"
            aria-pressed={inspectorOpen}
            title="Toggle inspector (⌥⌘I)"
          >
            <SidebarSimple size={18} style={{ transform: 'scaleX(-1)' }} />
          </button>
        )}
      </div>
    </div>
  )
}
