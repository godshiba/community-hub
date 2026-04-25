import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  SquaresFour,
  ShieldCheck,
  CalendarBlank,
  Timer,
  Robot,
  ChartBar,
  Gear
} from '@phosphor-icons/react'
import type { PanelId } from '@shared/types'
import { usePanelStore } from '@/stores/panel.store'
import { useShellStore } from '@/stores/shell.store'
import { useAgentStore } from '@/stores/agent.store'
import { useConnectionStore } from '@/stores/connection.store'
import { StatusDot, type StatusTone } from '@/components/ui-native/StatusDot'
import type { ConnectionStatus } from '@shared/settings-types'

function connectionTone(s: ConnectionStatus): StatusTone {
  if (s === 'connected') return 'success'
  if (s === 'connecting') return 'warning'
  if (s === 'error') return 'error'
  return 'neutral'
}
import { cn } from '@/lib/utils'

interface NavItem {
  id: PanelId
  icon: React.ComponentType<{ size?: number; weight?: 'regular' | 'bold' }>
  label: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', icon: SquaresFour, label: 'Dashboard' }]
  },
  {
    label: 'Community',
    items: [
      { id: 'moderation', icon: ShieldCheck, label: 'Moderation' },
      { id: 'events', icon: CalendarBlank, label: 'Events' },
      { id: 'scheduler', icon: Timer, label: 'Scheduler' }
    ]
  },
  {
    label: 'AI',
    items: [{ id: 'agent', icon: Robot, label: 'Agent' }]
  },
  {
    label: 'Tools',
    items: [{ id: 'reports', icon: ChartBar, label: 'Reports' }]
  },
  {
    label: 'System',
    items: [{ id: 'settings', icon: Gear, label: 'Settings' }]
  }
]

export function SourceList(): React.ReactElement {
  const { activePanel, setActivePanel } = usePanelStore()
  const { sidebarVisible, sidebarWidth, setSidebarWidth } = useShellStore()
  const agentStatus = useAgentStore((s) => s.status)
  const pendingApprovals = useAgentStore((s) =>
    s.actions.filter((a) => a.status === 'pending').length
  )
  const { discord, telegram, fetchStatus } = useConnectionStore()

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 5000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const dragRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = sidebarWidth

    const onMove = (ev: PointerEvent): void => {
      if (!dragRef.current) return
      const delta = ev.clientX - startXRef.current
      setSidebarWidth(startWidthRef.current + delta)
    }

    const onUp = (): void => {
      dragRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [sidebarWidth, setSidebarWidth])

  if (!sidebarVisible) return <></>

  const agentHidden = agentStatus?.state === 'unavailable'

  return (
    <div
      className="relative flex flex-col shrink-0 border-r border-[var(--color-divider)] overflow-hidden"
      style={{
        width: sidebarWidth,
        background: 'rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {NAV_SECTIONS.map((section) => {
          const visible = section.items.filter(
            (item) => !(item.id === 'agent' && agentHidden)
          )
          if (visible.length === 0) return null

          return (
            <div key={section.label} className="mb-1">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-tertiary)] select-none">
                {section.label}
              </p>
              {visible.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  active={activePanel === item.id}
                  badge={item.id === 'agent' && pendingApprovals > 0 ? pendingApprovals : undefined}
                  onClick={() => setActivePanel(item.id)}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Footer: connection status */}
      <div className="border-t border-[var(--color-divider)] px-4 py-3 space-y-2">
        <button
          className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
          onClick={() => setActivePanel('agent')}
          title="Go to Agent"
        >
          <StatusDot
            tone={
              agentStatus?.state === 'active' ? 'success'
              : agentStatus?.state === 'error' ? 'error'
              : agentStatus?.state === 'paused' ? 'warning'
              : 'neutral'
            }
          />
          <span className="text-[12px] text-[var(--color-fg-secondary)] truncate">
            Agent: {agentStatus?.state ?? 'unavailable'}
          </span>
          {pendingApprovals > 0 && (
            <span className="ml-auto text-[11px] font-semibold text-[var(--color-accent)]">
              {pendingApprovals} pending
            </span>
          )}
        </button>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            onClick={() => setActivePanel('settings')}
            title={`Discord: ${discord}`}
          >
            <StatusDot tone={connectionTone(discord)} />
            <span className="text-[12px] text-[var(--color-fg-tertiary)]">Discord</span>
          </button>
          <button
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            onClick={() => setActivePanel('settings')}
            title={`Telegram: ${telegram}`}
          >
            <StatusDot tone={connectionTone(telegram)} />
            <span className="text-[12px] text-[var(--color-fg-tertiary)]">Telegram</span>
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-[var(--color-accent)]/20 transition-colors"
        onPointerDown={onResizePointerDown}
        aria-hidden
      />
    </div>
  )
}

interface NavRowProps {
  item: NavItem
  active: boolean
  badge?: number
  onClick: () => void
}

function NavRow({ item, active, badge, onClick }: NavRowProps): React.ReactElement {
  const Icon = item.icon

  return (
    <div className="relative px-2">
      {/* Framer selection pill — morphs between rows via layoutId */}
      {active && (
        <motion.div
          layoutId="sidebar-selection"
          className="absolute inset-0 rounded-[var(--radius-sm)]"
          style={{ background: 'var(--color-accent-fill)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      )}
      <button
        onClick={onClick}
        aria-label={item.label}
        className={cn(
          'relative w-full flex items-center gap-2.5 px-2 h-8 rounded-[var(--radius-sm)]',
          'transition-colors duration-150 select-none',
          active
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)] hover:bg-white/[0.04]'
        )}
      >
        <Icon
          size={16}
          weight={active ? 'bold' : 'regular'}
        />
        <span className={cn('text-[15px] truncate flex-1 text-left', active && 'font-semibold')}>
          {item.label}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className={cn(
              'shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center',
              'text-[10px] font-semibold rounded-full',
              active
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-fg-tertiary)]/30 text-[var(--color-fg-primary)]'
            )}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    </div>
  )
}
