import { memo, useMemo, type CSSProperties } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEventsStore } from '@/stores/events.store'
import { Surface } from '@/components/ui-native/Surface'
import { Button } from '@/components/ui-native/Button'
import type { CommunityEvent } from '@shared/events-types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayCell {
  day: number
  date: string
  inMonth: boolean
  events: readonly CommunityEvent[]
}

function buildCalendar(month: string, events: readonly CommunityEvent[]): readonly DayCell[] {
  const [year, mon] = month.split('-').map(Number)
  const firstDay = new Date(year, mon - 1, 1)
  const lastDay = new Date(year, mon, 0)
  const startOffset = firstDay.getDay()

  const eventsByDate = new Map<string, CommunityEvent[]>()
  for (const e of events) {
    const dateKey = e.eventDate.slice(0, 10)
    const existing = eventsByDate.get(dateKey)
    if (existing) existing.push(e)
    else eventsByDate.set(dateKey, [e])
  }

  const cells: DayCell[] = []
  const prevLast = new Date(year, mon - 1, 0)
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevLast.getDate() - i
    const prevMonth = prevLast.getMonth() + 1
    const prevYear = prevLast.getFullYear()
    const date = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date, inMonth: false, events: [] })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date, inMonth: true, events: eventsByDate.get(date) ?? [] })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    const nextMonth = new Date(year, mon, 1)
    const nextMon = nextMonth.getMonth() + 1
    const nextYear = nextMonth.getFullYear()
    for (let d = 1; d <= remaining; d++) {
      const date = `${nextYear}-${String(nextMon).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, date, inMonth: false, events: [] })
    }
  }
  return cells
}

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function navigateMonth(current: string, delta: number): string {
  const [year, mon] = current.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const NAV: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingInline: 'var(--space-3)',
  paddingBlock: 'var(--space-2)',
  borderBottom: '1px solid var(--color-divider)'
}

const WEEKDAY: CSSProperties = {
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-fg-tertiary)',
  paddingBlock: 6
}

export const EventCalendar = memo(function EventCalendar(): React.ReactElement {
  const events           = useEventsStore((s) => s.events)
  const calendarMonth    = useEventsStore((s) => s.calendarMonth)
  const setCalendarMonth = useEventsStore((s) => s.setCalendarMonth)
  const fetchEventDetail = useEventsStore((s) => s.fetchEventDetail)

  const cells = useMemo(() => buildCalendar(calendarMonth, events), [calendarMonth, events])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Surface variant="raised" radius="lg" bordered style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={NAV}>
        <Button variant="icon" size="sm" onClick={() => setCalendarMonth(navigateMonth(calendarMonth, -1))} aria-label="Previous month">
          <CaretLeft size={14} weight="bold" />
        </Button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-fg-primary)' }}>
          {formatMonthLabel(calendarMonth)}
        </span>
        <Button variant="icon" size="sm" onClick={() => setCalendarMonth(navigateMonth(calendarMonth, 1))} aria-label="Next month">
          <CaretRight size={14} weight="bold" />
        </Button>
      </div>

      <div style={{ flex: 1, padding: 'var(--space-2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {WEEKDAYS.map((d) => <div key={d} style={WEEKDAY}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, flex: 1, gridAutoRows: 'minmax(72px, 1fr)' }}>
          {cells.map((cell) => {
            const isToday = cell.date === today
            const cellStyle: CSSProperties = {
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              border: 'none',
              background: cell.inMonth ? 'transparent' : 'transparent',
              opacity: cell.inMonth ? 1 : 0.32,
              cursor: cell.events.length > 0 ? 'pointer' : 'default',
              outline: isToday ? '1px solid var(--color-accent)' : 'none',
              outlineOffset: -1,
              transition: 'background var(--duration-fast) var(--ease-standard)'
            }
            return (
              <button
                key={cell.date}
                style={cellStyle}
                className="ui-native-list-row"
                onClick={() => { if (cell.events.length > 0) fetchEventDetail(cell.events[0].id) }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? 'var(--color-accent)' : 'var(--color-fg-tertiary)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {cell.day}
                </span>
                <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {cell.events.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      style={{
                        fontSize: 10,
                        lineHeight: 1.3,
                        paddingInline: 4,
                        paddingBlock: 1,
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--color-accent-fill)',
                        color: 'var(--color-accent)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {cell.events.length > 3 && (
                    <span style={{ fontSize: 10, color: 'var(--color-fg-tertiary)' }}>
                      +{cell.events.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Surface>
  )
})
