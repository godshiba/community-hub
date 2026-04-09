import { GlassPanel } from '@/components/glass/GlassPanel'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CredentialsForm } from './CredentialsForm'
import { AiProviderForm } from './AiProviderForm'
import { AppPreferencesForm } from './AppPreferencesForm'
import { AgentProfileEditor } from './AgentProfileEditor'
import { AutomationRules } from './AutomationRules'
import { PatternLibrary } from './PatternLibrary'
import { SpamProtectionForm } from './SpamProtectionForm'
import { RaidProtectionForm } from './RaidProtectionForm'
import { EscalationConfigForm } from './EscalationConfigForm'

export function SettingsPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6 overflow-y-auto h-full">
      <div className="mb-4">
        <PanelHeader title="Settings" subtitle="Platform credentials, AI configuration, and preferences" />
      </div>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="bg-glass-surface border-glass mb-4">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="ai">AI Provider</TabsTrigger>
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms">
          <CredentialsForm />
        </TabsContent>

        <TabsContent value="ai">
          <AiProviderForm />
        </TabsContent>

        <TabsContent value="agent">
          <div className="space-y-4">
            <AgentProfileEditor />
            <AutomationRules />
            <PatternLibrary />
          </div>
        </TabsContent>

        <TabsContent value="protection">
          <div className="space-y-4">
            <SpamProtectionForm />
            <RaidProtectionForm />
            <EscalationConfigForm />
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <AppPreferencesForm />
        </TabsContent>
      </Tabs>
    </GlassPanel>
  )
}
