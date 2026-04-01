import { useEffect } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useEventsStore } from '@/stores/events.store'
import { EventList } from './EventList'
import { EventCalendar } from './EventCalendar'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'

export function EventsPanel(): React.ReactElement {
  const { viewMode, setViewMode, selectedEvent, fetchEvents, openForm } = useEventsStore()

  useEffect(() => { fetchEvents() }, [])

  return (
    <GlassPanel className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Events</h2>
          <p className="text-xs text-text-secondary">Manage events, RSVPs, and reminders</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-glass-surface rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => openForm()}
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            New Event
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4 h-[calc(100%-5rem)]">
        <div className={selectedEvent ? 'w-1/2' : 'w-full'}>
          {viewMode === 'list' ? <EventList /> : <EventCalendar />}
        </div>

        {selectedEvent && (
          <div className="w-1/2">
            <EventDetail />
          </div>
        )}
      </div>

      <EventForm />
    </GlassPanel>
  )
}
