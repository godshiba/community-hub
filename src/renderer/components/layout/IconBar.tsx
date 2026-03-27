import {
  LayoutDashboard,
  Bot,
  Calendar,
  Shield,
  CalendarDays,
  FileBarChart,
  Settings
} from 'lucide-react'
import type { PanelId } from '@shared/types'
import { usePanelStore } from '@/stores/panel.store'
import { cn } from '@/lib/utils'

interface NavItem {
  id: PanelId
  icon: React.ComponentType<{ className?: string }>
  label: string
  bottom?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'agent', icon: Bot, label: 'Agent Terminal' },
  { id: 'scheduler', icon: Calendar, label: 'Scheduler' },
  { id: 'moderation', icon: Shield, label: 'Moderation' },
  { id: 'events', icon: CalendarDays, label: 'Events' },
  { id: 'reports', icon: FileBarChart, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings', bottom: true }
]

export function IconBar(): React.ReactElement {
  const { activePanel, setActivePanel } = usePanelStore()

  const topItems = NAV_ITEMS.filter((item) => !item.bottom)
  const bottomItems = NAV_ITEMS.filter((item) => item.bottom)

  return (
    <div className="w-12 bg-glass-surface border-r border-glass-border flex flex-col items-center py-2 shrink-0">
      <div className="flex flex-col items-center gap-1 flex-1">
        {topItems.map((item) => (
          <IconButton
            key={item.id}
            item={item}
            active={activePanel === item.id}
            onClick={() => setActivePanel(item.id)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-1">
        {bottomItems.map((item) => (
          <IconButton
            key={item.id}
            item={item}
            active={activePanel === item.id}
            onClick={() => setActivePanel(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface IconButtonProps {
  item: NavItem
  active: boolean
  onClick: () => void
}

function IconButton({ item, active, onClick }: IconButtonProps): React.ReactElement {
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-10 h-10 flex items-center justify-center rounded-[var(--radius-input)] transition-all duration-150',
        active
          ? 'bg-accent/15 text-accent'
          : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
      )}
      title={item.label}
      aria-label={item.label}
    >
      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-r" />
      )}
      <Icon className="size-[18px]" />
    </button>
  )
}
