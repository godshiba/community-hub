import { memo, type CSSProperties } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Surface } from '@/components/ui-native/Surface'
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
  const stroke = platform === 'discord' ? '#5865F2' : '#26A5E4'
  return (
    <Surface variant="raised" radius="lg" bordered style={CARD}>
      <div style={HEADER}>
        <h3 style={TITLE}>Member Growth</h3>
        <span style={SUBTITLE}>{platform}</span>
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data as GrowthPoint[]} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.18)"
              tick={{ fill: 'rgba(255,255,255,0.42)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              stroke="rgba(255,255,255,0.18)"
              tick={{ fill: 'rgba(255,255,255,0.42)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
              contentStyle={{
                background: 'rgba(28, 28, 32, 0.92)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.92)',
                fontSize: 12,
                padding: '6px 10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Members"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: stroke }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Surface>
  )
})
