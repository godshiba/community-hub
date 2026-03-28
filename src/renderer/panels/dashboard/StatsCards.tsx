import { GlassCard } from '@/components/glass/GlassCard'
import { TrendingUp, TrendingDown, Users, Activity, BarChart3, Zap } from 'lucide-react'
import type { DashboardStats } from '@shared/analytics-types'

interface StatsCardsProps {
  stats: DashboardStats
}

const CARD_CONFIG = [
  { key: 'totalMembers' as const, icon: Users, color: 'text-accent' },
  { key: 'growthRate' as const, icon: TrendingUp, color: 'text-success' },
  { key: 'activeUsers' as const, icon: Activity, color: 'text-warning' },
  { key: 'engagementRate' as const, icon: Zap, color: 'text-discord' }
]

export function StatsCards({ stats }: StatsCardsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-4 gap-3">
      {CARD_CONFIG.map(({ key, icon: Icon, color }) => {
        const card = stats[key]
        const isPositive = card.trend >= 0

        return (
          <GlassCard key={key} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted">{card.label}</span>
              <Icon className={`size-4 ${color}`} />
            </div>
            <div className="text-2xl font-semibold text-text-primary">
              {card.value.toLocaleString()}{card.unit ? card.unit : ''}
            </div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive
                ? <TrendingUp className="size-3" />
                : <TrendingDown className="size-3" />}
              <span>{isPositive ? '+' : ''}{card.trend}%</span>
              <span className="text-text-muted ml-1">vs prev period</span>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
