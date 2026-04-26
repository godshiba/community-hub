import { memo } from 'react'
import { Bar, BarChart, Cell } from 'recharts'
import {
  BAR_RADIUS,
  CHART_COLORS,
  ChartTheme,
  ThemedGrid,
  ThemedTooltip,
  ThemedXAxis,
  ThemedYAxis
} from '@/components/charts/ChartTheme'

interface EngagementChartProps {
  discord: number
  telegram: number
}

export const EngagementChart = memo(function EngagementChart(
  { discord, telegram }: EngagementChartProps
): React.ReactElement {
  const data = [
    { platform: 'Discord',  messages: discord,  fill: CHART_COLORS.platform.discord  },
    { platform: 'Telegram', messages: telegram, fill: CHART_COLORS.platform.telegram }
  ]

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-fg-tertiary)',
          margin: '0 0 8px'
        }}
      >
        Platform comparison (messages)
      </p>
      <ChartTheme height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <ThemedGrid />
          <ThemedXAxis dataKey="platform" />
          <ThemedYAxis />
          <ThemedTooltip valueFormatter={(v) => Number(v).toLocaleString()} />
          <Bar dataKey="messages" radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.platform} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartTheme>
    </div>
  )
})
