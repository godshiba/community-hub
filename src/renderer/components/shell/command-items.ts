import type { PanelId } from '@shared/types'
import type { CommunityMember } from '@shared/moderation-types'

export type CommandCategory = 'Navigation' | 'Actions' | 'Settings' | 'Members' | 'Recent'

export interface CommandItem {
  id: string
  label: string
  description?: string
  category: CommandCategory
  keywords?: readonly string[]
  panelId?: PanelId
  icon?: string
  shortcut?: string
  action?: () => void
}

export const NAVIGATION_COMMANDS: ReadonlyArray<Omit<CommandItem, 'action'>> = [
  { id: 'nav-dashboard',   label: 'Dashboard',       description: 'Community analytics overview',     category: 'Navigation', panelId: 'dashboard',  shortcut: '⌘1', keywords: ['analytics', 'stats', 'overview'] },
  { id: 'nav-moderation',  label: 'Moderation',      description: 'Manage members, warnings, bans',   category: 'Navigation', panelId: 'moderation', shortcut: '⌘2', keywords: ['members', 'ban', 'warn', 'users'] },
  { id: 'nav-events',      label: 'Events',           description: 'Manage events and RSVPs',          category: 'Navigation', panelId: 'events',     shortcut: '⌘3', keywords: ['calendar', 'rsvp', 'schedule'] },
  { id: 'nav-scheduler',   label: 'Scheduler',        description: 'Schedule posts and messages',      category: 'Navigation', panelId: 'scheduler',  shortcut: '⌘4', keywords: ['post', 'message', 'queue'] },
  { id: 'nav-agent',       label: 'Agent Terminal',   description: 'AI agent actions and approvals',   category: 'Navigation', panelId: 'agent',      shortcut: '⌘5', keywords: ['ai', 'bot', 'automation', 'approve'] },
  { id: 'nav-reports',     label: 'Reports',          description: 'Community health reports',         category: 'Navigation', panelId: 'reports',    shortcut: '⌘6', keywords: ['pdf', 'export', 'analytics'] },
  { id: 'nav-settings',    label: 'Settings',         description: 'Platform credentials and config',  category: 'Navigation', panelId: 'settings',   shortcut: '⌘7', keywords: ['credentials', 'api', 'token', 'configure'] }
]

export const ACTION_COMMANDS: ReadonlyArray<Omit<CommandItem, 'action'>> = [
  { id: 'action-sync',            label: 'Sync Now',           description: 'Sync members from Discord and Telegram', category: 'Actions', shortcut: '⌥⌘S', keywords: ['sync', 'refresh', 'update'] },
  { id: 'action-new-post',        label: 'New Post',           description: 'Schedule a new post',                    category: 'Actions', shortcut: '⌘N',   keywords: ['post', 'schedule', 'create'] },
  { id: 'action-new-event',       label: 'New Event',          description: 'Create a new event',                     category: 'Actions', shortcut: '⇧⌘N',  keywords: ['event', 'calendar', 'create'] },
  { id: 'action-generate-report', label: 'Generate Report',    description: 'Generate a community health report',     category: 'Actions', shortcut: '⌘R',   keywords: ['report', 'pdf', 'export', 'generate'] },
  { id: 'action-open-settings',   label: 'Open Settings',      description: 'Configure credentials and preferences',  category: 'Actions', shortcut: '⌘,',   keywords: ['settings', 'preferences', 'configure'] },
  { id: 'action-toggle-agent',    label: 'Toggle Agent',       description: 'Start or pause the autonomous agent',    category: 'Actions',                    keywords: ['agent', 'ai', 'start', 'pause', 'toggle'] }
]

export const SETTINGS_COMMANDS: ReadonlyArray<Omit<CommandItem, 'action'>> = [
  { id: 'settings-discord',       label: 'Discord Settings',          description: 'Bot token and server configuration', category: 'Settings', panelId: 'settings', keywords: ['discord', 'bot', 'token', 'server'] },
  { id: 'settings-telegram',      label: 'Telegram Settings',         description: 'Bot token and chat configuration',   category: 'Settings', panelId: 'settings', keywords: ['telegram', 'bot', 'chat'] },
  { id: 'settings-ai',            label: 'AI Provider Settings',      description: 'Configure AI provider and keys',     category: 'Settings', panelId: 'settings', keywords: ['ai', 'openai', 'anthropic', 'grok', 'gemini', 'api key'] },
  { id: 'settings-general',       label: 'General Settings',          description: 'Notifications and app preferences',  category: 'Settings', panelId: 'settings', keywords: ['general', 'notifications', 'preferences'] }
]

export function memberToCommandItem(m: CommunityMember): CommandItem {
  return {
    id: `member-${m.id}`,
    label: m.username,
    description: `${m.platform} · ${m.status}`,
    category: 'Members',
    panelId: 'moderation',
    keywords: [m.username, m.platform, m.status]
  }
}

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
