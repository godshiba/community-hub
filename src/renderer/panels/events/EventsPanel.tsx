import { GlassPanel } from '@/components/glass/GlassPanel'

export function EventsPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Events</h2>
      <p className="text-sm text-text-secondary mt-1">Event management and RSVPs</p>
    </GlassPanel>
  )
}
