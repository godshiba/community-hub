import { GlassPanel } from '@/components/glass/GlassPanel'

export function ModerationPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Moderation</h2>
      <p className="text-sm text-text-secondary mt-1">Member management and warnings</p>
    </GlassPanel>
  )
}
