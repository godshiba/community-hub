import { GlassCard } from '@/components/glass/GlassCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { PlatformMetric } from '@shared/analytics-types'

interface PlatformComparisonProps {
  data: readonly PlatformMetric[]
}

const DISCORD_COLOR = '#5865F2'
const TELEGRAM_COLOR = '#26A5E4'

export function PlatformComparison({ data }: PlatformComparisonProps): React.ReactElement {
  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-4">Platform Comparison</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data as PlatformMetric[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="metric"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="discord" name="Discord" fill={DISCORD_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="telegram" name="Telegram" fill={TELEGRAM_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
