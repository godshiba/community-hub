import type { PanelId } from '@shared/types'

export type CommandCategory = 'Navigation' | 'Actions' | 'Settings'

export interface CommandItem {
  id: string
  label: string
  description?: string
  category: CommandCategory
  keywords?: string[]
  panelId?: PanelId
  action?: () => void
}

export const NAVIGATION_COMMANDS: Omit<CommandItem, 'action'>[] = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Community analytics overview', category: 'Navigation', panelId: 'dashboard', keywords: ['analytics', 'stats', 'overview'] },
  { id: 'nav-moderation', label: 'Moderation', description: 'Manage members, warnings, bans', category: 'Navigation', panelId: 'moderation', keywords: ['members', 'ban', 'warn', 'users'] },
  { id: 'nav-events', label: 'Events', description: 'Manage events and RSVPs', category: 'Navigation', panelId: 'events', keywords: ['calendar', 'rsvp', 'schedule'] },
  { id: 'nav-scheduler', label: 'Scheduler', description: 'Schedule posts and messages', category: 'Navigation', panelId: 'scheduler', keywords: ['post', 'message', 'queue'] },
  { id: 'nav-agent', label: 'Agent Terminal', description: 'AI agent actions and approvals', category: 'Navigation', panelId: 'agent', keywords: ['ai', 'bot', 'automation', 'approve'] },
  { id: 'nav-reports', label: 'Reports', description: 'Community health reports', category: 'Navigation', panelId: 'reports', keywords: ['pdf', 'export', 'analytics'] },
  { id: 'nav-settings', label: 'Settings', description: 'Platform credentials and config', category: 'Navigation', panelId: 'settings', keywords: ['credentials', 'api', 'token', 'configure'] }
]

export function fuzzyMatch(query: string, item: Omit<CommandItem, 'action'>): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const haystack = [
    item.label,
    item.description ?? '',
    ...(item.keywords ?? [])
  ].join(' ').toLowerCase()
  return haystack.includes(q)
}
