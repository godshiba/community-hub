import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { GrowthPoint, PlatformFilter } from '@shared/analytics-types'

interface GrowthChartProps {
  data: readonly GrowthPoint[]
  platform: PlatformFilter
}

const PLATFORM_COLORS: Record<PlatformFilter, string> = {
  discord: '#5865F2',
  telegram: '#26A5E4'
}

export const GrowthChart = memo(function GrowthChart({ data, platform }: GrowthChartProps): React.ReactElement {
  const color = PLATFORM_COLORS[platform]

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-4">Member Growth</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data as GrowthPoint[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 15, 25, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Members"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
})
