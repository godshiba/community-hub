import { GlassPanel } from '@/components/glass/GlassPanel'

export function AgentPanel(): React.ReactElement {
  return (
    <GlassPanel className="p-6">
      <h2 className="text-lg font-semibold text-text-primary">Agent Terminal</h2>
      <p className="text-sm text-text-secondary mt-1">AI agent actions and controls</p>
    </GlassPanel>
  )
}
