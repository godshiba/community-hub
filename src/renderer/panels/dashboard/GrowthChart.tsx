import { memo, type CSSProperties } from 'react'
import { Line, LineChart } from 'recharts'
import { Surface } from '@/components/ui-native/Surface'
import {
  CHART_COLORS,
  ChartTheme,
  ThemedGrid,
  ThemedTooltip,
  ThemedXAxis,
  ThemedYAxis
} from '@/components/charts/ChartTheme'
import type { GrowthPoint, PlatformFilter } from '@shared/analytics-types'

interface GrowthChartProps {
  data: readonly GrowthPoint[]
  platform: PlatformFilter
}

const CARD: CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
}

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const TITLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-fg-primary)',
  margin: 0
}

const SUBTITLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)'
}

export const GrowthChart = memo(function GrowthChart({ data, platform }: GrowthChartProps): React.ReactElement {
  const stroke = CHART_COLORS.platform[platform]
  return (
    <Surface variant="raised" radius="lg" bordered style={CARD}>
      <div style={HEADER}>
        <h3 style={TITLE}>Member Growth</h3>
        <span style={SUBTITLE}>{platform}</span>
      </div>
      <ChartTheme height={240}>
        <LineChart data={data as GrowthPoint[]} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <ThemedGrid />
          <ThemedXAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
          <ThemedYAxis />
          <ThemedTooltip valueFormatter={(v) => Number(v).toLocaleString()} />
          <Line
            type="monotone"
            dataKey="value"
            name="Members"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: stroke, strokeWidth: 0 }}
          />
        </LineChart>
      </ChartTheme>
    </Surface>
  )
})
