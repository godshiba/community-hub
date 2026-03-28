import { GlassPanel } from '@/components/glass/GlassPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CredentialsForm } from './CredentialsForm'
import { AiProviderForm } from './AiProviderForm'
import { AppPreferencesForm } from './AppPreferencesForm'

export function SettingsPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
      <p className="text-sm text-text-secondary mt-1 mb-4">
        Platform credentials, AI configuration, and preferences
      </p>

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="bg-glass-surface border-glass mb-4">
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="ai">AI Provider</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms">
          <CredentialsForm />
        </TabsContent>

        <TabsContent value="ai">
          <AiProviderForm />
        </TabsContent>

        <TabsContent value="preferences">
          <AppPreferencesForm />
        </TabsContent>
      </Tabs>
    </GlassPanel>
  )
}
