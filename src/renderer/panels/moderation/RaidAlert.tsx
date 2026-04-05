import { useEffect } from 'react'
import { useSpamStore } from '@/stores/spam.store'
import { Siren, ShieldOff } from 'lucide-react'

export function RaidAlert(): React.ReactElement | null {
  const { raidState, fetchRaidState, setManualLockdown } = useSpamStore()

  useEffect(() => {
    fetchRaidState()
    // Poll raid state every 10 seconds
    const interval = setInterval(fetchRaidState, 10_000)
    return () => clearInterval(interval)
  }, [])

  if (raidState === 'normal') return null

  const isActive = raidState === 'active'
  const isSuspected = raidState === 'suspected'
  const isCooldown = raidState === 'cooldown'

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
      isActive
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : isSuspected
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }`}>
      <Siren className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
      <div className="flex-1">
        <span className="text-xs font-medium">
          {isActive && 'RAID ACTIVE — Auto-protections engaged'}
          {isSuspected && 'Raid suspected — Monitoring join velocity'}
          {isCooldown && 'Raid cooldown — Returning to normal'}
        </span>
      </div>
      {(isActive || isSuspected) && (
        <button
          onClick={() => setManualLockdown(false)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-glass-surface border border-glass hover:border-accent/30 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ShieldOff className="w-3 h-3" />
          Dismiss
        </button>
      )}
    </div>
  )
}
