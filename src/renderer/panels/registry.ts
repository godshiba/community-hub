import type { ComponentType } from 'react'
import type { PanelId } from '@shared/types'
import { DashboardPanel } from './dashboard/DashboardPanel'
import { AgentPanel } from './agent/AgentPanel'
import { SchedulerPanel } from './scheduler/SchedulerPanel'
import { ModerationPanel } from './moderation/ModerationPanel'
import { EventsPanel } from './events/EventsPanel'
import { ReportsPanel } from './reports/ReportsPanel'
import { SettingsPanel } from './settings/SettingsPanel'

export const PANEL_REGISTRY: Record<PanelId, ComponentType> = {
  dashboard: DashboardPanel,
  agent: AgentPanel,
  scheduler: SchedulerPanel,
  moderation: ModerationPanel,
  events: EventsPanel,
  reports: ReportsPanel,
  settings: SettingsPanel
}
