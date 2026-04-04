import { useEffect } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useEventsStore } from '@/stores/events.store'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { SegmentedControl } from '@/components/shared/SegmentedControl'
import { EventList } from './EventList'
import { EventCalendar } from './EventCalendar'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'

export function EventsPanel(): React.ReactElement {
  const { viewMode, setViewMode, selectedEvent, fetchEvents, openForm } = useEventsStore()

  useEffect(() => { fetchEvents() }, [])

  return (
    <GlassPanel className="p-4 space-y-4 overflow-y-auto h-full">
      <PanelHeader
        title="Events"
        subtitle="Manage events, RSVPs, and reminders"
        actions={
          <>
            <SegmentedControl
              options={[
                { value: 'list', label: 'List' },
                { value: 'calendar', label: 'Calendar' }
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as 'list' | 'calendar')}
            />
            <button
              onClick={() => openForm()}
              className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
            >
              New Event
            </button>
          </>
        }
      />

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
