import { useEffect, type CSSProperties } from 'react'
import { Plus } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useEventsStore } from '@/stores/events.store'
import { Button } from '@/components/ui-native/Button'
import { Tooltip } from '@/components/ui-native/Tooltip'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { EventList } from './EventList'
import { EventCalendar } from './EventCalendar'
import { EventDetail } from './EventDetail'
import { EventForm } from './EventForm'

const VIEW_OPTIONS = [
  { value: 'list',     label: 'List'     },
  { value: 'calendar', label: 'Calendar' }
] as const satisfies ReadonlyArray<{ value: 'list' | 'calendar'; label: string }>

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  height: '100%',
  minHeight: 0,
  maxWidth: 1400,
  width: '100%',
  marginInline: 'auto'
}

export function EventsPanel(): React.ReactElement {
  const viewMode    = useEventsStore((s) => s.viewMode)
  const setViewMode = useEventsStore((s) => s.setViewMode)
  const fetchEvents = useEventsStore((s) => s.fetchEvents)
  const openForm    = useEventsStore((s) => s.openForm)

  useEffect(() => { void fetchEvents() }, [fetchEvents])

  useEffect(() => {
    const onNewEvent = (): void => openForm()
    window.addEventListener('panel:newEvent', onNewEvent)
    return () => window.removeEventListener('panel:newEvent', onNewEvent)
  }, [openForm])

  usePanelToolbar({
    title: 'Events',
    inspector: {
      enabled: true,
      renderEmpty: () => <EventDetail />
    },
    actions: (
      <>
        <SegmentedControl
          size="sm"
          ariaLabel="Event view"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={(v) => setViewMode(v)}
        />
        <Tooltip label="New event" shortcut={['⇧', '⌘', 'N']} side="bottom">
          <Button
            variant="primary"
            size="sm"
            leading={<Plus size={13} weight="bold" />}
            onClick={() => openForm()}
          >
            New event
          </Button>
        </Tooltip>
      </>
    )
  })

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Events" />
      {viewMode === 'list' ? <EventList /> : <EventCalendar />}
      <EventForm />
    </div>
  )
}
