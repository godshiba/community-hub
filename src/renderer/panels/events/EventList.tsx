import { memo, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react'
import { useEventsStore } from '@/stores/events.store'
import { useDebounce } from '@/hooks/useDebounce'
import { TextField } from '@/components/ui-native/TextField'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { ListRow } from '@/components/ui-native/ListRow'
import { Pill } from '@/components/ui-native/Pill'
import { Surface } from '@/components/ui-native/Surface'
import { Skeleton } from '@/components/ui-native/Skeleton'
import { EmptyState } from '@/components/ui-native/EmptyState'
import type { EventStatus } from '@shared/events-types'

const STATUS_PILL: Record<EventStatus, { variant: 'neutral' | 'accent' | 'success' | 'warning' | 'error'; label: string }> = {
  draft:     { variant: 'neutral', label: 'Draft'     },
  scheduled: { variant: 'accent',  label: 'Scheduled' },
  active:    { variant: 'success', label: 'Active'    },
  completed: { variant: 'neutral', label: 'Completed' },
  cancelled: { variant: 'error',   label: 'Cancelled' }
}

type ListFilter = 'upcoming' | 'past' | 'cancelled' | 'all'

const FILTER_OPTIONS = [
  { value: 'upcoming',  label: 'Upcoming'  },
  { value: 'past',      label: 'Past'      },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all',       label: 'All'       }
] as const satisfies ReadonlyArray<{ value: ListFilter; label: string }>

const FILTER_BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingBlock: 'var(--space-2)'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const EventList = memo(function EventList(): React.ReactElement {
  const events           = useEventsStore((s) => s.events)
  const loading          = useEventsStore((s) => s.loading)
  const listFilter       = useEventsStore((s) => s.listFilter)
  const search           = useEventsStore((s) => s.search)
  const setListFilter    = useEventsStore((s) => s.setListFilter)
  const setSearch        = useEventsStore((s) => s.setSearch)
  const fetchEventDetail = useEventsStore((s) => s.fetchEventDetail)
  const selectedEvent    = useEventsStore((s) => s.selectedEvent)

  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounce(localSearch, 300)
  useEffect(() => {
    if (debouncedSearch !== search) setSearch(debouncedSearch)
  }, [debouncedSearch, search, setSearch])

  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onFocus = (): void => searchInputRef.current?.focus()
    window.addEventListener('panel:focusSearch', onFocus)
    return () => window.removeEventListener('panel:focusSearch', onFocus)
  }, [])

  const segmentedValue: ListFilter = listFilter ?? 'all'

  return (
    <Surface variant="raised" radius="lg" bordered style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ ...FILTER_BAR, paddingInline: 'var(--space-3)', borderBottom: '1px solid var(--color-divider)' }}>
        <SegmentedControl
          size="sm"
          ariaLabel="Event filter"
          options={FILTER_OPTIONS}
          value={segmentedValue}
          onChange={(v) => setListFilter(v === 'all' ? undefined : (v as Exclude<ListFilter, 'all'>))}
        />
        <TextField
          ref={searchInputRef}
          inputSize="sm"
          placeholder="Search events…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          prefix={<MagnifyingGlass size={12} />}
          containerStyle={{ width: 220, marginLeft: 'auto', flex: '0 0 220px' }}
          fullWidth={false}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rect" height={52} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            size="md"
            icon={<CalendarBlank size={40} />}
            title="No events"
            subtitle="Create one with the New Event button in the toolbar."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {events.map((event) => {
              const status = STATUS_PILL[event.status]
              return (
                <ListRow
                  key={event.id}
                  density="comfortable"
                  selected={selectedEvent?.event.id === event.id}
                  onSelect={() => fetchEventDetail(event.id)}
                  title={event.title}
                  subtitle={`${formatDate(event.eventDate)}${event.eventTime ? ` · ${event.eventTime}` : ''}${event.location ? ` · ${event.location}` : ''}`}
                  trailing={
                    <>
                      {event.platform && (
                        <Pill size="sm" variant={event.platform === 'discord' ? 'discord' : 'telegram'}>
                          {event.platform === 'discord' ? 'Discord' : 'Telegram'}
                        </Pill>
                      )}
                      <Pill size="sm" variant={status.variant}>{status.label}</Pill>
                    </>
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </Surface>
  )
})
