import { useState, type CSSProperties } from 'react'
import {
  Plug, Brain, Gear, Bell, ShieldWarning, ShieldCheck, Siren, ArrowsCounterClockwise,
  Robot, BookOpen, Tag, ChartLine
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { CredentialsForm } from './CredentialsForm'
import { AiProviderForm } from './AiProviderForm'
import { AppPreferencesForm } from './AppPreferencesForm'
import { AgentProfileEditor } from './AgentProfileEditor'
import { AutomationRules } from './AutomationRules'
import { PatternLibrary } from './PatternLibrary'
import { SpamProtectionForm } from './SpamProtectionForm'
import { RaidProtectionForm } from './RaidProtectionForm'
import { EscalationConfigForm } from './EscalationConfigForm'
import { RoleManagementForm } from './RoleManagementForm'
import { ContentPolicyForm } from './ContentPolicyForm'
import { ChannelAgentConfig } from './ChannelAgentConfig'

type SectionId =
  | 'credentials' | 'ai' | 'preferences'
  | 'agent' | 'channels' | 'automation' | 'patterns'
  | 'spam' | 'raid' | 'content' | 'escalation' | 'roles'

interface SectionDef {
  id: SectionId
  label: string
  icon: Icon
  group: 'integrations' | 'agent' | 'protection' | 'app'
  render: () => React.ReactElement
}

const SECTIONS: ReadonlyArray<SectionDef> = [
  // Integrations
  { id: 'credentials', label: 'Credentials',  icon: Plug,                   group: 'integrations', render: () => <CredentialsForm /> },
  { id: 'ai',          label: 'AI provider',  icon: Brain,                  group: 'integrations', render: () => <AiProviderForm /> },

  // Agent
  { id: 'agent',       label: 'Agent profile', icon: Robot,                 group: 'agent', render: () => <AgentProfileEditor /> },
  { id: 'channels',    label: 'Channel routing', icon: ChartLine,           group: 'agent', render: () => <ChannelAgentConfig /> },
  { id: 'automation',  label: 'Automation rules', icon: ArrowsCounterClockwise, group: 'agent', render: () => <AutomationRules /> },
  { id: 'patterns',    label: 'Pattern library', icon: BookOpen,            group: 'agent', render: () => <PatternLibrary /> },

  // Protection
  { id: 'spam',        label: 'Spam',         icon: ShieldWarning,          group: 'protection', render: () => <SpamProtectionForm /> },
  { id: 'raid',        label: 'Raid',         icon: Siren,                  group: 'protection', render: () => <RaidProtectionForm /> },
  { id: 'content',     label: 'Content policy', icon: Tag,                  group: 'protection', render: () => <ContentPolicyForm /> },
  { id: 'escalation',  label: 'Escalation',   icon: Bell,                   group: 'protection', render: () => <EscalationConfigForm /> },
  { id: 'roles',       label: 'Roles',        icon: ShieldCheck,            group: 'protection', render: () => <RoleManagementForm /> },

  // App
  { id: 'preferences', label: 'App preferences', icon: Gear,                group: 'app', render: () => <AppPreferencesForm /> }
]

const GROUP_LABELS: Record<SectionDef['group'], string> = {
  integrations: 'Integrations',
  agent:        'Agent',
  protection:   'Protection',
  app:          'App'
}

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  height: '100%',
  minHeight: 0
}

const TWO_COLUMN: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 1fr)',
  gap: 'var(--space-4)'
}

const RAIL: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  overflowY: 'auto'
}

const GROUP_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)',
  paddingInline: 'var(--space-2)',
  paddingBlock: 6,
  marginTop: 6
}

const RAIL_BUTTON_BASE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingInline: 'var(--space-2)',
  paddingBlock: 6,
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--color-fg-secondary)',
  textAlign: 'left',
  transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)'
}

const CONTENT_PANEL: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
  overflowY: 'auto'
}

export function SettingsPanel(): React.ReactElement {
  const [activeId, setActiveId] = useState<SectionId>('credentials')

  usePanelToolbar({
    title: 'Settings',
    subtitle: 'Configure integrations, preferences, and automation',
    inspector: { enabled: false }
  })

  const grouped = SECTIONS.reduce<Record<string, SectionDef[]>>((acc, s) => {
    (acc[s.group] ??= []).push(s)
    return acc
  }, {})

  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]!

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Settings" subtitle="Configure integrations, preferences, and automation" />

      <div style={TWO_COLUMN}>
        <nav style={RAIL} aria-label="Settings sections">
          {(Object.keys(grouped) as Array<SectionDef['group']>).map((group) => (
            <div key={group}>
              <div style={GROUP_LABEL}>{GROUP_LABELS[group]}</div>
              {grouped[group]!.map((section) => {
                const Icon = section.icon
                const selected = section.id === activeId
                const buttonStyle: CSSProperties = {
                  ...RAIL_BUTTON_BASE,
                  width: '100%',
                  background: selected ? 'var(--color-accent-fill)' : 'transparent',
                  color: selected ? 'var(--color-accent)' : 'var(--color-fg-secondary)',
                  fontWeight: selected ? 500 : 400
                }
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => setActiveId(section.id)}
                    style={buttonStyle}
                    className="ui-native-list-row"
                  >
                    <Icon size={14} weight={selected ? 'fill' : 'regular'} />
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={CONTENT_PANEL}>
          {active.render()}
        </div>
      </div>
    </div>
  )
}
