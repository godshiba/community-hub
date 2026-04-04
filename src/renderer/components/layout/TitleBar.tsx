import { Search, ChevronRight } from 'lucide-react'
import { usePanelStore } from '@/stores/panel.store'

const PANEL_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  agent: 'Agent Terminal',
  scheduler: 'Scheduler',
  moderation: 'Moderation',
  events: 'Events',
  reports: 'Reports',
  settings: 'Settings'
}

interface TitleBarProps {
  onSearchClick?: () => void
}

export function TitleBar({ onSearchClick }: TitleBarProps): React.ReactElement {
  const { activePanel, breadcrumbs } = usePanelStore()
  const crumbs = breadcrumbs.length > 0 ? breadcrumbs : [PANEL_LABELS[activePanel] ?? activePanel]

  return (
    <div
      className="h-8 bg-glass-surface border-b border-glass-border flex items-center justify-between shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: traffic light offset + breadcrumbs */}
      <div className="flex items-center gap-1.5 pl-20">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 text-text-muted" />}
            <span
              className={
                i === crumbs.length - 1
                  ? 'text-xs font-medium text-text-secondary'
                  : 'text-xs text-text-muted'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Center draggable region */}
      <div className="flex-1" />

      {/* Right: search button */}
      <div
        className="flex items-center pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={onSearchClick}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-text-muted hover:text-text-secondary hover:bg-white/[0.05] transition-colors"
          title="Command Palette (⌘K)"
          aria-label="Open command palette"
        >
          <Search className="size-3" />
          <span className="text-[10px]">⌘K</span>
        </button>
      </div>
    </div>
  )
}
