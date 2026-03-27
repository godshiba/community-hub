import { GlassPanel } from '@/components/glass/GlassPanel'

export function SchedulerPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Scheduler</h2>
      <p className="text-sm text-text-secondary mt-1">Multi-platform post scheduling</p>
    </GlassPanel>
  )
}
