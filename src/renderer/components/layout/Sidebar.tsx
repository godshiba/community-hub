import {
  LayoutDashboard,
  Bot,
  Calendar,
  Shield,
  CalendarDays,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { PanelId } from '@shared/types'
import { usePanelStore } from '@/stores/panel.store'
import { useAgentStore } from '@/stores/agent.store'
import { cn } from '@/lib/utils'

interface NavItem {
  id: PanelId
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
  },
  {
    label: 'Community',
    items: [
      { id: 'moderation', icon: Shield, label: 'Moderation' },
      { id: 'events', icon: CalendarDays, label: 'Events' },
      { id: 'scheduler', icon: Calendar, label: 'Scheduler' }
    ]
  },
  {
    label: 'AI',
    items: [{ id: 'agent', icon: Bot, label: 'Agent' }]
  },
  {
    label: 'Tools',
    items: [{ id: 'reports', icon: FileBarChart, label: 'Reports' }]
  }
]

const BOTTOM_ITEM: NavItem = { id: 'settings', icon: Settings, label: 'Settings' }

export function Sidebar(): React.ReactElement {
  const { activePanel, setActivePanel, sidebarCollapsed, toggleSidebar } = usePanelStore()
  const agentStatus = useAgentStore((s) => s.status)
  const agentUnavailable = agentStatus?.state === 'unavailable'

  const pendingApprovals = useAgentStore((s) =>
    s.actions.filter((a) => a.status === 'pending').length
  )

  return (
    <div
      className={cn(
        'flex flex-col bg-glass-surface border-r border-glass-border shrink-0 transition-all duration-200',
        sidebarCollapsed ? 'w-12' : 'w-48'
      )}
    >
      {/* Sections */}
      <div className="flex flex-col flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !(item.id === 'agent' && agentUnavailable)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={section.label} className="mb-1">
              {!sidebarCollapsed && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted select-none">
                  {section.label}
                </p>
              )}
              {sidebarCollapsed && <div className="h-2" />}
              {visibleItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activePanel === item.id}
                  collapsed={sidebarCollapsed}
                  badge={item.id === 'agent' && pendingApprovals > 0 ? pendingApprovals : undefined}
                  onClick={() => setActivePanel(item.id)}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Bottom: Settings + collapse toggle */}
      <div className="border-t border-glass-border py-2">
        <NavButton
          item={BOTTOM_ITEM}
          active={activePanel === BOTTOM_ITEM.id}
          collapsed={sidebarCollapsed}
          onClick={() => setActivePanel(BOTTOM_ITEM.id)}
        />
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-8 text-text-muted hover:text-text-secondary transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand (Cmd+B)' : 'Collapse (Cmd+B)'}
        >
          {sidebarCollapsed
            ? <ChevronRight className="size-3.5" />
            : <ChevronLeft className="size-3.5" />
          }
        </button>
      </div>
    </div>
  )
}

interface NavButtonProps {
  item: NavItem
  active: boolean
  collapsed: boolean
  badge?: number
  onClick: () => void
}

function NavButton({ item, active, collapsed, badge, onClick }: NavButtonProps): React.ReactElement {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cn(
        'relative w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-150 select-none',
        collapsed ? 'justify-center' : 'justify-start',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
      )}
    >
      {active && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-accent rounded-r" />
      )}
      <Icon className="size-[17px] shrink-0" />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'ml-auto shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center',
            'text-[10px] font-semibold rounded-full bg-accent text-white',
            collapsed && 'absolute top-1 right-1 ml-0'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
