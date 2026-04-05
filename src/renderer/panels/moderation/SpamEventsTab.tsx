import { useEffect } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useSpamStore } from '@/stores/spam.store'
import { Loader2, ShieldAlert } from 'lucide-react'
import type { SpamRuleType } from '@shared/spam-types'

const RULE_TYPE_LABELS: Record<SpamRuleType, string> = {
  message_rate: 'Rate limit',
  duplicate_message: 'Duplicate',
  link_spam: 'Link spam',
  mention_spam: 'Mentions',
  emoji_flood: 'Emoji flood',
  caps_flood: 'Caps flood'
}

const ACTION_COLORS: Record<string, string> = {
  delete: 'text-yellow-400',
  warn: 'text-orange-400',
  mute: 'text-blue-400',
  kick: 'text-red-400',
  ban: 'text-red-500'
}

export function SpamEventsTab(): React.ReactElement {
  const { events, eventsLoading, fetchEvents } = useSpamStore()

  useEffect(() => { fetchEvents({ limit: 100 }) }, [])

  if (eventsLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
        <ShieldAlert className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-sm">No spam events detected yet</span>
        <span className="text-xs mt-1">Spam detections will appear here in real-time</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-secondary">{events.length} events</span>
        <button
          onClick={() => fetchEvents({ limit: 100 })}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto">
        {events.map((event) => (
          <GlassCard key={event.id} elevation="surface" className="p-2.5 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-primary truncate">
                  {event.username}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-muted">
                  {event.platform}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-muted">
                  {RULE_TYPE_LABELS[event.ruleType] ?? event.ruleType}
                </span>
                <span className={`text-[10px] font-medium ${ACTION_COLORS[event.actionTaken] ?? 'text-text-secondary'}`}>
                  {event.actionTaken}
                </span>
              </div>
              {event.messageContent && (
                <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[400px]">
                  {event.messageContent}
                </p>
              )}
            </div>
            <span className="text-[10px] text-text-muted whitespace-nowrap">
              {formatRelative(event.detectedAt)}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso + 'Z').getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
