import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, LayoutDashboard, Bot, Calendar, Shield, CalendarDays, FileBarChart, Settings } from 'lucide-react'
import { usePanelStore } from '@/stores/panel.store'
import { NAVIGATION_COMMANDS, fuzzyMatch, type CommandItem } from './command-items'
import { cn } from '@/lib/utils'
import type { PanelId } from '@shared/types'

const PANEL_ICONS: Record<PanelId, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  agent: Bot,
  scheduler: Calendar,
  moderation: Shield,
  events: CalendarDays,
  reports: FileBarChart,
  settings: Settings
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { setActivePanel } = usePanelStore()

  const items: CommandItem[] = NAVIGATION_COMMANDS
    .filter((cmd) => fuzzyMatch(query, cmd))
    .map((cmd) => ({
      ...cmd,
      action: cmd.panelId
        ? () => { setActivePanel(cmd.panelId!); onClose() }
        : undefined
    }))

  const select = useCallback((item: CommandItem) => {
    item.action?.()
    setQuery('')
    setActiveIndex(0)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[activeIndex]) select(items[activeIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-backdrop-in"
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg mx-4',
          'bg-glass-overlay border border-glass-border-light rounded-[var(--radius-panel)]',
          'shadow-glass animate-modal-in overflow-hidden'
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
          <Search className="size-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search panels, actions..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <kbd className="text-[10px] text-text-muted border border-glass-border rounded px-1 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-muted text-center">No results for "{query}"</p>
          ) : (
            items.map((item, i) => {
              const Icon = item.panelId ? PANEL_ICONS[item.panelId] : null
              return (
                <button
                  key={item.id}
                  onClick={() => select(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === activeIndex
                      ? 'bg-accent/10 text-text-primary'
                      : 'text-text-secondary hover:bg-white/[0.04]'
                  )}
                >
                  {Icon && (
                    <div className={cn(
                      'size-7 rounded-[var(--radius-input)] flex items-center justify-center shrink-0',
                      i === activeIndex ? 'bg-accent/20 text-accent' : 'bg-white/[0.06] text-text-muted'
                    )}>
                      <Icon className="size-3.5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0">{item.category}</span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-glass-border text-[10px] text-text-muted">
          <span><kbd className="border border-glass-border rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-glass-border rounded px-1">↵</kbd> select</span>
          <span><kbd className="border border-glass-border rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
