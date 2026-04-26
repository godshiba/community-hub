import { memo, type CSSProperties } from 'react'
import { TrendUp, TrendDown, Users, Pulse, Lightning } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Surface } from '@/components/ui-native/Surface'
import { Sparkline } from '@/components/charts/Sparkline'
import type { DashboardStats } from '@shared/analytics-types'

interface StatsCardsProps {
  stats: DashboardStats
}

interface CardConfig {
  key: keyof DashboardStats
  icon: Icon
  iconColor: string
}

const CARDS: ReadonlyArray<CardConfig> = [
  { key: 'totalMembers',   icon: Users,    iconColor: 'var(--color-accent)'   },
  { key: 'growthRate',     icon: TrendUp,  iconColor: 'var(--color-success)'  },
  { key: 'activeUsers',    icon: Pulse,    iconColor: 'var(--color-warning)'  },
  { key: 'engagementRate', icon: Lightning, iconColor: 'var(--color-discord)' }
]

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 'var(--space-3)'
}

const CARD: CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 110,
  position: 'relative'
}

const SPARK_WRAP: CSSProperties = {
  position: 'absolute',
  bottom: 12,
  right: 12,
  pointerEvents: 'none',
  opacity: 0.85
}

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const LABEL: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-fg-tertiary)',
  letterSpacing: '0.01em'
}

const VALUE: CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  lineHeight: 1.1,
  color: 'var(--color-fg-primary)',
  fontVariantNumeric: 'tabular-nums'
}

const TREND: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 12,
  fontWeight: 500
}

const TREND_NOTE: CSSProperties = {
  color: 'var(--color-fg-tertiary)',
  marginLeft: 4,
  fontWeight: 400
}

export const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps): React.ReactElement {
  return (
    <div style={GRID}>
      {CARDS.map(({ key, icon: Icon, iconColor }) => {
        const card = stats[key]
        const isPositive = card.trend >= 0
        const trendColor = isPositive ? 'var(--color-success)' : 'var(--color-error)'
        const TrendIcon = isPositive ? TrendUp : TrendDown
        return (
          <Surface key={key} variant="raised" radius="lg" bordered style={CARD}>
            <div style={HEADER}>
              <span style={LABEL}>{card.label}</span>
              <Icon size={16} color={iconColor} weight="regular" />
            </div>
            <div style={VALUE}>
              {card.value.toLocaleString()}
              {card.unit ?? ''}
            </div>
            <div style={{ ...TREND, color: trendColor }}>
              <TrendIcon size={12} weight="bold" />
              <span>{isPositive ? '+' : ''}{card.trend}%</span>
              <span style={TREND_NOTE}>vs prev period</span>
            </div>
            {card.sparkline && card.sparkline.length > 1 && (
              <div style={SPARK_WRAP}>
                <Sparkline
                  data={card.sparkline}
                  width={64}
                  height={20}
                  stroke={trendColor}
                  ariaLabel={`${card.label} trend`}
                />
              </div>
            )}
          </Surface>
        )
      })}
    </div>
  )
})
