import { memo, useMemo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useEventsStore } from '@/stores/events.store'
import type { CommunityEvent } from '@shared/events-types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayCell {
  day: number
  date: string         // YYYY-MM-DD
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
    if (existing) {
      existing.push(e)
    } else {
      eventsByDate.set(dateKey, [e])
    }
  }

  const cells: DayCell[] = []

  // Previous month padding
  const prevLast = new Date(year, mon - 1, 0)
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevLast.getDate() - i
    const prevMonth = prevLast.getMonth() + 1
    const prevYear = prevLast.getFullYear()
    const date = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date, inMonth: false, events: [] })
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date, inMonth: true, events: eventsByDate.get(date) ?? [] })
  }

  // Next month padding
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

export const EventCalendar = memo(function EventCalendar(): React.ReactElement {
  const { events, calendarMonth, setCalendarMonth, fetchEventDetail } = useEventsStore()

  const cells = useMemo(() => buildCalendar(calendarMonth, events), [calendarMonth, events])
  const today = new Date().toISOString().slice(0, 10)

  return (
    <GlassCard className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between p-3 border-b border-glass-border">
        <button
          onClick={() => setCalendarMonth(navigateMonth(calendarMonth, -1))}
          className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Prev
        </button>
        <span className="text-sm font-medium text-text-primary">
          {formatMonthLabel(calendarMonth)}
        </span>
        <button
          onClick={() => setCalendarMonth(navigateMonth(calendarMonth, 1))}
          className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Next
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 p-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-text-muted py-1 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((cell) => (
            <button
              key={cell.date}
              onClick={() => {
                if (cell.events.length > 0) {
                  fetchEventDetail(cell.events[0].id)
                }
              }}
              className={`
                min-h-[4rem] p-1 rounded text-left transition-colors
                ${cell.inMonth ? 'hover:bg-glass-surface' : 'opacity-30'}
                ${cell.date === today ? 'ring-1 ring-accent/40' : ''}
              `}
            >
              <span className={`text-xs ${cell.date === today ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                {cell.day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {cell.events.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded bg-accent/10 text-accent truncate"
                  >
                    {e.title}
                  </div>
                ))}
                {cell.events.length > 3 && (
                  <span className="text-[10px] text-text-muted">+{cell.events.length - 3} more</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  )
})
