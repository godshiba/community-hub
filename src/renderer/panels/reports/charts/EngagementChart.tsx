import { memo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface EngagementChartProps {
  discord: number
  telegram: number
}

export const EngagementChart = memo(function EngagementChart(
  { discord, telegram }: EngagementChartProps
): React.ReactElement {
  const data = [
    { platform: 'Discord', messages: discord, fill: '#5865F2' },
    { platform: 'Telegram', messages: telegram, fill: '#26A5E4' }
  ]

  return (
    <div className="h-40">
      <p className="text-xs text-text-muted mb-2">Platform Comparison (Messages)</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="platform"
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
          <Bar dataKey="messages" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.platform} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
