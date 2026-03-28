import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Users } from 'lucide-react'
import type { Contributor } from '@shared/analytics-types'

interface TopContributorsProps {
  data: readonly Contributor[]
}

export const TopContributors = memo(function TopContributors({ data }: TopContributorsProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-text-primary mb-4">Top Contributors</h3>
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Users className="size-8 mb-2 opacity-40" />
          <p className="text-xs">Contributor data will appear after moderation module is active</p>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4">
      <h3 className="text-sm font-medium text-text-primary mb-4">Top Contributors</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-[32px_1fr_80px_80px_60px] gap-2 text-xs text-text-muted pb-2 border-b border-glass-border">
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Platform</span>
          <span className="text-right">Messages</span>
          <span className="text-right">Score</span>
        </div>
        {data.map((c, i) => (
          <div
            key={c.id}
            className="grid grid-cols-[32px_1fr_80px_80px_60px] gap-2 text-xs items-center"
          >
            <span className="text-text-muted">{i + 1}</span>
            <div className="flex items-center gap-2 min-w-0">
              {c.avatar
                ? <img src={c.avatar} alt="" className="size-5 rounded-full" />
                : <div className="size-5 rounded-full bg-glass-surface" />}
              <span className="text-text-primary truncate">{c.name}</span>
            </div>
            <span className={`text-right ${c.platform === 'discord' ? 'text-discord' : 'text-telegram'}`}>
              {c.platform === 'discord' ? 'Discord' : 'Telegram'}
            </span>
            <span className="text-right text-text-secondary">{c.messageCount.toLocaleString()}</span>
            <span className="text-right text-accent">{c.score}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
})
