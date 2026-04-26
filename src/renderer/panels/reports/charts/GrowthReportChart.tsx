import { memo } from 'react'
import { Legend, Line, LineChart } from 'recharts'
import {
  CHART_COLORS,
  ChartTheme,
  LEGEND_STYLE,
  ThemedGrid,
  ThemedTooltip,
  ThemedXAxis,
  ThemedYAxis
} from '@/components/charts/ChartTheme'
import type { GrowthDataPoint } from '@shared/reports-types'

interface GrowthReportChartProps {
  data: readonly GrowthDataPoint[]
}

export const GrowthReportChart = memo(function GrowthReportChart(
  { data }: GrowthReportChartProps
): React.ReactElement {
  return (
    <ChartTheme height={224}>
      <LineChart data={data as GrowthDataPoint[]} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <ThemedGrid />
        <ThemedXAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
        <ThemedYAxis />
        <ThemedTooltip valueFormatter={(v) => Number(v).toLocaleString()} />
        <Legend wrapperStyle={LEGEND_STYLE} />
        <Line
          type="monotone"
          dataKey="discord"
          name="Discord"
          stroke={CHART_COLORS.platform.discord}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="telegram"
          name="Telegram"
          stroke={CHART_COLORS.platform.telegram}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ChartTheme>
  )
})
