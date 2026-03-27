import { GlassPanel } from '@/components/glass/GlassPanel'

export function ReportsPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Reports</h2>
      <p className="text-sm text-text-secondary mt-1">Community health reports</p>
    </GlassPanel>
  )
}
