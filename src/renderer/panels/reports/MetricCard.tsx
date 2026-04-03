import { memo } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  positive?: boolean
  negative?: boolean
}

export const MetricCard = memo(function MetricCard({ label, value, positive, negative }: MetricCardProps): React.ReactElement {
  return (
    <div className="bg-glass-surface rounded p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={cn(
        'text-lg font-semibold mt-1',
        positive && 'text-emerald-400',
        negative && 'text-red-400',
        !positive && !negative && 'text-text-primary'
      )}>
        {value}
      </p>
    </div>
  )
})
