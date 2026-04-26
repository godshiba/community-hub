import { memo, type CSSProperties } from 'react'
import { useEventsStore } from '@/stores/events.store'
import { Button } from '@/components/ui-native/Button'
import { Pill } from '@/components/ui-native/Pill'
import { Divider } from '@/components/ui-native/Divider'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { CalendarBlank } from '@phosphor-icons/react'

const ROOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)'
}

const TITLE: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-fg-primary)'
}

const KV_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  rowGap: 6,
  columnGap: 12,
  fontSize: 12
}

const KEY: CSSProperties = { color: 'var(--color-fg-tertiary)' }
const VALUE: CSSProperties = { color: 'var(--color-fg-primary)' }

const SECTION_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)',
  marginBottom: 6
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export const EventDetail = memo(function EventDetail(): React.ReactElement {
  const selectedEvent  = useEventsStore((s) => s.selectedEvent)
  const detailLoading  = useEventsStore((s) => s.detailLoading)
  const openForm       = useEventsStore((s) => s.openForm)
  const deleteEvent    = useEventsStore((s) => s.deleteEvent)
  const exportAttendees = useEventsStore((s) => s.exportAttendees)

  if (detailLoading && !selectedEvent) {
    return (
      <div style={{ padding: 'var(--space-4)', fontSize: 12, color: 'var(--color-fg-tertiary)' }}>
        Loading…
      </div>
    )
  }

  if (!selectedEvent) {
    return (
      <EmptyState
        size="md"
        icon={<CalendarBlank size={28} />}
        title="No event selected"
        subtitle="Select an event to inspect details, RSVPs, and reminders."
      />
    )
  }

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
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }

  return (
    <div style={ROOT}>
      <div>
        <div style={TITLE}>{event.title}</div>
        <div style={{ marginTop: 4 }}>
          <Pill size="sm" variant="neutral">{event.status}</Pill>
        </div>
      </div>

      <Divider />

      <div style={KV_GRID}>
        <span style={KEY}>Date</span>
        <span style={VALUE}>{formatDate(event.eventDate)}</span>
        {event.eventTime && (<><span style={KEY}>Time</span><span style={VALUE}>{event.eventTime}</span></>)}
        {event.location  && (<><span style={KEY}>Location</span><span style={VALUE}>{event.location}</span></>)}
        {event.platform  && (<><span style={KEY}>Platform</span><span style={{ ...VALUE, textTransform: 'capitalize' }}>{event.platform}</span></>)}
        {event.capacity != null && (<><span style={KEY}>Capacity</span><span style={VALUE}>{rsvpCounts.yes} / {event.capacity}</span></>)}
      </div>

      {event.description && (
        <>
          <Divider />
          <div>
            <div style={SECTION_LABEL}>Description</div>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-fg-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {event.description}
            </p>
          </div>
        </>
      )}

      <Divider />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button size="sm" variant="secondary" onClick={() => openForm(event)}>Edit</Button>
        <Button size="sm" variant="destructive" onClick={() => { void handleDelete() }}>Delete</Button>
        {rsvps.length > 0 && (
          <Button size="sm" variant="plain" onClick={() => { void handleExport() }} style={{ marginLeft: 'auto' }}>
            Export CSV
          </Button>
        )}
      </div>

      <Divider />

      <div>
        <div style={SECTION_LABEL}>RSVPs ({rsvps.length})</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <Pill size="sm" variant="success">Yes {rsvpCounts.yes}</Pill>
          <Pill size="sm" variant="warning">Maybe {rsvpCounts.maybe}</Pill>
          <Pill size="sm" variant="error">No {rsvpCounts.no}</Pill>
        </div>
        {rsvps.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-fg-tertiary)' }}>No RSVPs yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rsvps.map((r) => (
              <div
                key={r.id}
                style={{
                  paddingInline: 8,
                  paddingBlock: 6,
                  background: 'var(--color-surface-card)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}
              >
                <span style={{ color: 'var(--color-fg-primary)' }}>
                  {r.username}
                  <span style={{ color: 'var(--color-fg-tertiary)', marginLeft: 4, textTransform: 'capitalize' }}>· {r.platform}</span>
                </span>
                <Pill
                  size="sm"
                  variant={r.response === 'yes' ? 'success' : r.response === 'maybe' ? 'warning' : 'error'}
                >
                  {r.response}
                </Pill>
              </div>
            ))}
          </div>
        )}
      </div>

      {reminders.length > 0 && (
        <>
          <Divider />
          <div>
            <div style={SECTION_LABEL}>Reminders ({reminders.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reminders.map((r) => (
                <div
                  key={r.id}
                  style={{
                    paddingInline: 8,
                    paddingBlock: 6,
                    background: 'var(--color-surface-card)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12
                  }}
                >
                  <span style={{ color: 'var(--color-fg-secondary)' }}>
                    {new Date(r.reminderTime).toLocaleString()}
                  </span>
                  <Pill size="sm" variant={r.sent ? 'success' : 'neutral'}>
                    {r.sent ? 'Sent' : 'Pending'}
                  </Pill>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
})
