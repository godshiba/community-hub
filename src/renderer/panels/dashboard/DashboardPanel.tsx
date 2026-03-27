import { GlassPanel } from '@/components/glass/GlassPanel'

export function DashboardPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Dashboard</h2>
      <p className="text-sm text-text-secondary mt-1">Analytics and community stats</p>
    </GlassPanel>
  )
}
