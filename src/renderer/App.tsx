import { Button } from '@/components/ui/button'

export function App(): React.ReactElement {
  return (
    <div className="h-screen w-screen bg-[#0a0a0f] text-white/87 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-accent">Community Hub</h1>
        <p className="text-sm text-text-secondary">Phase 0 — Scaffold Ready</p>
        <Button variant="default" size="sm">
          Get Started
        </Button>
      </div>
    </div>
  )
}
