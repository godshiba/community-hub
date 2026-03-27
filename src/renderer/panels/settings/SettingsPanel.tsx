import { GlassPanel } from '@/components/glass/GlassPanel'

export function SettingsPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
      <p className="text-sm text-text-secondary mt-1">Platform credentials and preferences</p>
    </GlassPanel>
  )
}
