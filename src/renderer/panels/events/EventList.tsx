import { memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useEventsStore } from '@/stores/events.store'
import type { CommunityEvent, EventStatus } from '@shared/events-types'

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: 'text-text-muted bg-text-muted/10',
  scheduled: 'text-blue-400 bg-blue-400/10',
  active: 'text-green-400 bg-green-400/10',
  completed: 'text-text-secondary bg-text-secondary/10',
  cancelled: 'text-red-400 bg-red-400/10'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(time: string | null): string {
  if (!time) return ''
  return ` at ${time}`
}

function EventRow({ event, onSelect }: { event: CommunityEvent; onSelect: (id: number) => void }): React.ReactElement {
  return (
    <button
      onClick={() => onSelect(event.id)}
      className="w-full text-left px-3 py-2.5 hover:bg-glass-surface rounded transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-text-primary truncate">{event.title}</h4>
          <p className="text-xs text-text-muted mt-0.5">
            {formatDate(event.eventDate)}{formatTime(event.eventTime)}
            {event.location && ` — ${event.location}`}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {event.platform && (
            <span className="text-xs text-text-muted capitalize">{event.platform}</span>
          )}
          <span className={`px-2 py-0.5 text-xs rounded capitalize ${STATUS_STYLES[event.status]}`}>
            {event.status}
          </span>
        </div>
      </div>
    </button>
  )
}

export const EventList = memo(function EventList(): React.ReactElement {
  const { events, loading, listFilter, setListFilter, search, setSearch, fetchEventDetail } = useEventsStore()

  const filters = [
    { value: 'upcoming' as const, label: 'Upcoming' },
    { value: 'past' as const, label: 'Past' },
    { value: 'cancelled' as const, label: 'Cancelled' },
    { value: undefined, label: 'All' }
  ]

  return (
    <GlassCard className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="p-3 border-b border-glass-border space-y-2">
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.label}
              onClick={() => setListFilter(f.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                listFilter === f.value
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted"
        />
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-text-muted">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-muted">No events found</div>
        ) : (
          <div className="divide-y divide-glass-border/50">
            {events.map((event) => (
              <EventRow key={event.id} event={event} onSelect={fetchEventDetail} />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
})
