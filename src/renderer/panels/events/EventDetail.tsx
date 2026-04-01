import { GlassCard } from '@/components/glass/GlassCard'
import { useEventsStore } from '@/stores/events.store'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function EventDetail(): React.ReactElement | null {
  const { selectedEvent, detailLoading, clearDetail, openForm, deleteEvent, exportAttendees } = useEventsStore()

  if (detailLoading) {
    return (
      <GlassCard className="p-4 h-full flex items-center justify-center">
        <span className="text-xs text-text-muted">Loading...</span>
      </GlassCard>
    )
  }

  if (!selectedEvent) return null

  const { event, rsvps, reminders, rsvpCounts } = selectedEvent

  async function handleDelete(): Promise<void> {
    await deleteEvent(event.id)
  }

  async function handleExport(): Promise<void> {
    const csv = await exportAttendees(event.id)
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/\s+/g, '_')}_attendees.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassCard className="p-4 h-full overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{event.title}</h3>
          <p className="text-xs text-text-muted capitalize mt-0.5">{event.status}</p>
        </div>
        <button
          onClick={clearDetail}
          className="text-text-muted hover:text-text-secondary text-xs"
        >
          Close
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Date</span>
          <p className="text-text-primary">{formatDate(event.eventDate)}</p>
        </div>
        {event.eventTime && (
          <div>
            <span className="text-text-muted">Time</span>
            <p className="text-text-primary">{event.eventTime}</p>
          </div>
        )}
        {event.location && (
          <div>
            <span className="text-text-muted">Location</span>
            <p className="text-text-primary">{event.location}</p>
          </div>
        )}
        {event.platform && (
          <div>
            <span className="text-text-muted">Platform</span>
            <p className="text-text-primary capitalize">{event.platform}</p>
          </div>
        )}
        {event.capacity && (
          <div>
            <span className="text-text-muted">Capacity</span>
            <p className="text-text-primary">{rsvpCounts.yes} / {event.capacity}</p>
          </div>
        )}
      </div>

      {event.description && (
        <div>
          <span className="text-xs text-text-muted">Description</span>
          <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openForm(event)}
          className="px-2 py-1 text-xs text-accent bg-accent/10 rounded hover:bg-accent/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-xs text-red-400 bg-red-400/10 rounded hover:bg-red-400/20 transition-colors"
        >
          Delete
        </button>
        {rsvps.length > 0 && (
          <button
            onClick={handleExport}
            className="px-2 py-1 text-xs text-text-muted bg-glass-surface rounded hover:bg-glass-raised transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* RSVP summary */}
      <div>
        <h4 className="text-xs text-text-muted font-medium mb-2">
          RSVPs ({rsvps.length})
        </h4>
        <div className="flex gap-3 text-xs mb-2">
          <span className="text-green-400">Yes: {rsvpCounts.yes}</span>
          <span className="text-yellow-400">Maybe: {rsvpCounts.maybe}</span>
          <span className="text-red-400">No: {rsvpCounts.no}</span>
        </div>
        {rsvps.length === 0 ? (
          <p className="text-xs text-text-muted">No RSVPs yet</p>
        ) : (
          <div className="space-y-1">
            {rsvps.map((r) => (
              <div key={r.id} className="px-2 py-1.5 bg-glass-surface rounded text-xs flex items-center justify-between">
                <div>
                  <span className="text-text-primary">{r.username}</span>
                  <span className="text-text-muted ml-1 capitalize">({r.platform})</span>
                </div>
                <span className={`capitalize ${
                  r.response === 'yes' ? 'text-green-400' :
                  r.response === 'maybe' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {r.response}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div>
          <h4 className="text-xs text-text-muted font-medium mb-1">Reminders ({reminders.length})</h4>
          <div className="space-y-1">
            {reminders.map((r) => (
              <div key={r.id} className="px-2 py-1.5 bg-glass-surface rounded text-xs flex items-center justify-between">
                <span className="text-text-secondary">
                  {new Date(r.reminderTime).toLocaleString()}
                </span>
                <span className={r.sent ? 'text-green-400' : 'text-text-muted'}>
                  {r.sent ? 'Sent' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
