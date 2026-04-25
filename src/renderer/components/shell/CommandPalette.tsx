import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog } from 'radix-ui'
import {
  MagnifyingGlass,
  SquaresFour,
  Shield,
  CalendarDots,
  CalendarCheck,
  Robot,
  ChartBar,
  Gear,
  ArrowClockwise,
  Plus,
  Lightning,
  FileText,
  User
} from '@phosphor-icons/react'
import { usePanelStore } from '@/stores/panel.store'
import { useShellStore } from '@/stores/shell.store'
import { KeyCap } from '@/components/ui-native/KeyCap'
import {
  NAVIGATION_COMMANDS,
  ACTION_COMMANDS,
  SETTINGS_COMMANDS,
  memberToCommandItem,
  fuzzyMatch,
  type CommandItem,
  type CommandCategory
} from './command-items'
import { cn } from '@/lib/utils'
import type { PanelId } from '@shared/types'

const PANEL_ICON: Record<PanelId, React.ComponentType<{ size?: number; className?: string }>> = {
  dashboard:  SquaresFour,
  moderation: Shield,
  events:     CalendarDots,
  scheduler:  CalendarCheck,
  agent:      Robot,
  reports:    ChartBar,
  settings:   Gear
}

const ACTION_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'action-sync':            ArrowClockwise,
  'action-new-post':        Plus,
  'action-new-event':       CalendarDots,
  'action-generate-report': FileText,
  'action-open-settings':   Gear,
  'action-toggle-agent':    Lightning
}

const CATEGORY_ORDER: CommandCategory[] = ['Recent', 'Navigation', 'Actions', 'Settings', 'Members']

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface GroupedResults {
  category: CommandCategory
  items: CommandItem[]
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.ReactElement {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [memberItems, setMemberItems] = useState<CommandItem[]>([])
  const [memberLoading, setMemberLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { setActivePanel } = usePanelStore()
  const { recentCommands, addRecentCommand } = useShellStore()

  // Build Recent items from persisted command ids
  const recentItems: CommandItem[] = recentCommands
    .map((id) => {
      const src = [...NAVIGATION_COMMANDS, ...ACTION_COMMANDS, ...SETTINGS_COMMANDS].find((c) => c.id === id)
      if (!src) return null
      return { ...src, category: 'Recent' as CommandCategory } as CommandItem
    })
    .filter((x): x is CommandItem => x !== null)

  // Actions with wired handlers
  const actionItems: CommandItem[] = ACTION_COMMANDS.map((cmd) => ({
    ...cmd,
    action: buildActionHandler(cmd.id, { setActivePanel, onClose, addRecentCommand })
  }))

  const navItems: CommandItem[] = NAVIGATION_COMMANDS.map((cmd) => ({
    ...cmd,
    action: () => {
      if (cmd.panelId) setActivePanel(cmd.panelId)
      addRecentCommand(cmd.id)
      onClose()
    }
  }))

  const settingsItems: CommandItem[] = SETTINGS_COMMANDS.map((cmd) => ({
    ...cmd,
    action: () => {
      setActivePanel('settings')
      addRecentCommand(cmd.id)
      onClose()
    }
  }))

  // Async member search
  useEffect(() => {
    if (!open || !query.trim()) {
      setMemberItems([])
      return
    }
    setMemberLoading(true)
    const controller = new AbortController()
    window.api.invoke('moderation:searchMembers', { query: query.trim(), limit: 5 })
      .then((res) => {
        if (controller.signal.aborted) return
        if (res.success) {
          setMemberItems(res.data.map((m) => ({
            ...memberToCommandItem(m),
            action: () => {
              setActivePanel('moderation')
              addRecentCommand(memberToCommandItem(m).id)
              onClose()
            }
          })))
        }
      })
      .catch(() => { /* member search is best-effort */ })
      .finally(() => {
        if (!controller.signal.aborted) setMemberLoading(false)
      })
    return () => { controller.abort() }
  }, [query, open, setActivePanel, addRecentCommand, onClose])

  // Build grouped flat list
  const allSources: Record<CommandCategory, CommandItem[]> = {
    Recent:     recentItems.filter((i) => fuzzyMatch(query, i)),
    Navigation: navItems.filter((i) => fuzzyMatch(query, i)),
    Actions:    actionItems.filter((i) => fuzzyMatch(query, i)),
    Settings:   settingsItems.filter((i) => fuzzyMatch(query, i)),
    Members:    memberItems
  }

  const groups: GroupedResults[] = CATEGORY_ORDER
    .map((cat) => ({ category: cat, items: allSources[cat] }))
    .filter((g) => g.items.length > 0)

  const flatItems: CommandItem[] = groups.flatMap((g) => g.items)

  const select = useCallback((item: CommandItem) => {
    item.action?.()
    setQuery('')
    setActiveIndex(0)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setMemberItems([])
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
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[activeIndex]) select(flatItems[activeIndex])
    }
  }

  // Running flat index across groups for active highlight
  let runningIndex = 0

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.40)',
            backdropFilter: 'blur(4px)',
            zIndex: 'var(--z-modal)' as unknown as number,
            animation: 'backdrop-in var(--duration-standard) var(--ease-standard) both'
          }}
        />

        {/* Palette */}
        <Dialog.Content
          aria-label="Command palette"
          onKeyDown={handleKeyDown}
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            translate: '-50% 0',
            width: 640,
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-surface-card-elevated)',
            border: '1px solid var(--color-divider-strong)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-modal)',
            overflow: 'hidden',
            zIndex: 'var(--z-modal)' as unknown as number,
            outline: 'none',
            transformOrigin: 'top center',
            animation: 'modal-in var(--duration-standard) var(--ease-standard) both'
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-divider)'
            }}
          >
            <MagnifyingGlass size={16} color="var(--color-fg-tertiary)" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search panels, actions, members..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                color: 'var(--color-fg-primary)',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <KeyCap keys={['Esc']} size="sm" />
          </div>

          {/* Results */}
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {flatItems.length === 0 && !memberLoading ? (
              <p style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--color-fg-tertiary)',
                fontFamily: 'var(--font-sans)'
              }}>
                {query ? `No results for "${query}"` : 'Start typing to search…'}
              </p>
            ) : (
              groups.map((group) => {
                const groupStart = runningIndex
                runningIndex += group.items.length
                return (
                  <div key={group.category}>
                    <div style={{
                      padding: '4px 16px 2px',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--color-fg-tertiary)',
                      fontFamily: 'var(--font-sans)'
                    }}>
                      {group.category}
                    </div>
                    {group.items.map((item, localIdx) => {
                      const flatIdx = groupStart + localIdx
                      const isActive = flatIdx === activeIndex
                      const Icon = item.panelId
                        ? PANEL_ICON[item.panelId]
                        : ACTION_ICON[item.id] ?? (item.category === 'Members' ? User : null)
                      return (
                        <button
                          key={item.id}
                          onClick={() => select(item)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '7px 16px',
                            textAlign: 'left',
                            background: isActive ? 'var(--color-accent-fill)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)'
                          }}
                        >
                          {Icon && (
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              background: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.07)',
                              color: isActive ? '#fff' : 'var(--color-fg-tertiary)'
                            }}>
                              <Icon size={14} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 500,
                              color: isActive ? 'var(--color-fg-primary)' : 'var(--color-fg-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.label}
                            </p>
                            {item.description && (
                              <p style={{
                                margin: 0,
                                fontSize: 11,
                                color: 'var(--color-fg-tertiary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.shortcut && (
                            <span style={{
                              fontSize: 11,
                              color: 'var(--color-fg-tertiary)',
                              flexShrink: 0
                            }}>
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            borderTop: '1px solid var(--color-divider)',
            fontSize: 11,
            color: 'var(--color-fg-tertiary)',
            fontFamily: 'var(--font-sans)'
          }}>
            <span><KeyCap keys={['↑', '↓']} size="sm" /> Navigate</span>
            <span><KeyCap keys={['↵']} size="sm" /> Select</span>
            <span><KeyCap keys={['Esc']} size="sm" /> Close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function buildActionHandler(
  id: string,
  ctx: {
    setActivePanel: (p: PanelId) => void
    onClose: () => void
    addRecentCommand: (id: string) => void
  }
): () => void {
  const { setActivePanel, onClose, addRecentCommand } = ctx
  const persist = (): void => { addRecentCommand(id); onClose() }

  switch (id) {
    case 'action-sync':
      return () => {
        window.api.invoke('moderation:syncMembers', undefined).catch(() => {/* best-effort */})
        persist()
      }
    case 'action-new-post':
      return () => { setActivePanel('scheduler'); persist() }
    case 'action-new-event':
      return () => { setActivePanel('events'); persist() }
    case 'action-generate-report':
      return () => { setActivePanel('reports'); persist() }
    case 'action-open-settings':
      return () => { setActivePanel('settings'); persist() }
    case 'action-toggle-agent':
      return () => { setActivePanel('agent'); persist() }
    default:
      return persist
  }
}
