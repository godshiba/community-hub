import { Fragment, memo, type CSSProperties } from 'react'
import { Surface } from '@/components/ui-native/Surface'
import type { HeatmapCell } from '@shared/analytics-types'

interface ActivityHeatmapProps {
  data: readonly HeatmapCell[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function intensity(value: number, max: number): { background: string; opacity: number } {
  if (max === 0 || value === 0) {
    return { background: 'rgba(255,255,255,0.04)', opacity: 1 }
  }
  const ratio = Math.max(0.08, Math.min(1, value / max))
  return {
    background: 'var(--color-accent)',
    opacity: ratio * 0.85 + 0.05
  }
}

const CARD: CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
}

const TITLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-fg-primary)',
  margin: 0
}

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '40px repeat(24, minmax(0, 1fr))',
  gap: 2
}

const HOUR_LABEL: CSSProperties = {
  fontSize: 9,
  color: 'var(--color-fg-tertiary)',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums'
}

const DAY_LABEL: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-fg-tertiary)',
  display: 'flex',
  alignItems: 'center',
  paddingRight: 6
}

export const ActivityHeatmap = memo(function ActivityHeatmap({ data }: ActivityHeatmapProps): React.ReactElement {
  const cellMap = new Map<string, number>()
  let maxValue = 0
  for (const cell of data) {
    cellMap.set(`${cell.day}-${cell.hour}`, cell.value)
    if (cell.value > maxValue) maxValue = cell.value
  }

  return (
    <Surface variant="raised" radius="lg" bordered style={CARD}>
      <h3 style={TITLE}>Activity Heatmap</h3>
      <div style={{ overflowX: 'auto' }}>
        <div style={GRID}>
          <div />
          {HOURS.map((h) => (
            <div key={h} style={HOUR_LABEL}>{h.toString().padStart(2, '0')}</div>
          ))}

          {DAYS.map((dayLabel, dayIdx) => (
            <Fragment key={dayLabel}>
              <div style={DAY_LABEL}>{dayLabel}</div>
              {HOURS.map((hour) => {
                const value = cellMap.get(`${dayIdx}-${hour}`) ?? 0
                const style = intensity(value, maxValue)
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    title={`${dayLabel} ${hour.toString().padStart(2, '0')}:00 — ${value} messages`}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 'var(--radius-xs)',
                      background: style.background,
                      opacity: style.opacity,
                      transition: 'opacity var(--duration-fast) var(--ease-standard)'
                    }}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </Surface>
  )
})
