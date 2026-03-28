import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import type { HeatmapCell } from '@shared/analytics-types'

interface ActivityHeatmapProps {
  data: readonly HeatmapCell[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getIntensity(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-glass-surface'
  const ratio = value / max
  if (ratio > 0.75) return 'bg-accent/60'
  if (ratio > 0.5) return 'bg-accent/40'
  if (ratio > 0.25) return 'bg-accent/20'
  return 'bg-accent/10'
}

export const ActivityHeatmap = memo(function ActivityHeatmap({ data }: ActivityHeatmapProps): React.ReactElement {
  const cellMap = new Map<string, number>()
  let maxValue = 0

  for (const cell of data) {
    const key = `${cell.day}-${cell.hour}`
    cellMap.set(key, cell.value)
    if (cell.value > maxValue) maxValue = cell.value
  }

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-4">Activity Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `48px repeat(24, 1fr)` }}>
          {/* Hour labels */}
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[9px] text-text-muted text-center">
              {h.toString().padStart(2, '0')}
            </div>
          ))}

          {/* Day rows */}
          {DAYS.map((dayLabel, dayIdx) => (
            <>
              <div key={`label-${dayIdx}`} className="text-xs text-text-muted flex items-center">
                {dayLabel}
              </div>
              {HOURS.map((hour) => {
                const value = cellMap.get(`${dayIdx}-${hour}`) ?? 0
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    className={`aspect-square rounded-sm ${getIntensity(value, maxValue)} transition-colors`}
                    title={`${dayLabel} ${hour}:00 — ${value} messages`}
                  />
                )
              })}
            </>
          ))}
        </div>
      </div>
    </GlassCard>
  )
})
