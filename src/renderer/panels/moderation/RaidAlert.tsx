import { useEffect, type CSSProperties } from 'react'
import { Siren, ShieldSlash } from '@phosphor-icons/react'
import { useSpamStore } from '@/stores/spam.store'
import { Button } from '@/components/ui-native/Button'

const TONES = {
  active:    { color: 'var(--color-error)',   bg: 'color-mix(in oklch, var(--color-error) 12%, transparent)',   border: 'color-mix(in oklch, var(--color-error) 30%, transparent)' },
  suspected: { color: 'var(--color-warning)', bg: 'color-mix(in oklch, var(--color-warning) 12%, transparent)', border: 'color-mix(in oklch, var(--color-warning) 30%, transparent)' },
  cooldown:  { color: 'var(--color-accent)',  bg: 'color-mix(in oklch, var(--color-accent) 12%, transparent)',  border: 'color-mix(in oklch, var(--color-accent) 30%, transparent)' }
} as const

export function RaidAlert(): React.ReactElement | null {
  const { raidState, fetchRaidState, setManualLockdown } = useSpamStore()

  useEffect(() => {
    fetchRaidState()
    const interval = setInterval(fetchRaidState, 10_000)
    return () => clearInterval(interval)
  }, [fetchRaidState])

  if (raidState === 'normal') return null

  const isActive = raidState === 'active'
  const tone = TONES[raidState]

  const root: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    paddingInline: 'var(--space-3)',
    paddingBlock: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    background: tone.bg,
    border: `1px solid ${tone.border}`,
    color: tone.color
  }

  return (
    <div style={root} role={isActive ? 'alert' : 'status'}>
      <Siren size={16} weight="fill" style={isActive ? { animation: 'status-dot-pulse 1.6s ease-out infinite' } : undefined} />
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
        {isActive && 'RAID ACTIVE — Auto-protections engaged'}
        {raidState === 'suspected' && 'Raid suspected — Monitoring join velocity'}
        {raidState === 'cooldown'  && 'Raid cooldown — Returning to normal'}
      </span>
      {raidState !== 'cooldown' && (
        <Button size="sm" variant="plain" onClick={() => setManualLockdown(false)} leading={<ShieldSlash size={12} />}>
          Dismiss
        </Button>
      )}
    </div>
  )
}
