import { create } from 'zustand'
import type {
  CommunityEvent,
  EventDetail,
  EventPayload,
  EventsFilter,
  EventStatus
} from '@shared/events-types'

type ViewMode = 'list' | 'calendar'
type ListFilter = EventStatus | 'upcoming' | 'past' | undefined

interface EventsState {
  events: readonly CommunityEvent[]
  loading: boolean
  error: string | null

  // View
  viewMode: ViewMode
  listFilter: ListFilter
  search: string
  calendarMonth: string // YYYY-MM

  // Detail / split view
  selectedEvent: EventDetail | null
  detailLoading: boolean

  // Form
  formOpen: boolean
  editingEvent: CommunityEvent | null

  // Actions
  setViewMode: (mode: ViewMode) => void
  setListFilter: (f: ListFilter) => void
  setSearch: (q: string) => void
  setCalendarMonth: (month: string) => void
  fetchEvents: () => Promise<void>
  fetchEventDetail: (id: number) => Promise<void>
  clearDetail: () => void
  createEvent: (payload: EventPayload) => Promise<CommunityEvent | null>
  updateEvent: (id: number, payload: EventPayload) => Promise<CommunityEvent | null>
  deleteEvent: (id: number) => Promise<void>
  openForm: (event?: CommunityEvent) => void
  closeForm: () => void
  exportAttendees: (eventId: number) => Promise<string | null>
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function buildFilter(state: EventsState): EventsFilter {
  if (state.viewMode === 'calendar') {
    return { month: state.calendarMonth, search: state.search || undefined }
  }
  return {
    status: state.listFilter,
    search: state.search || undefined
  }
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  viewMode: 'list',
  listFilter: 'upcoming',
  search: '',
  calendarMonth: currentMonth(),

  selectedEvent: null,
  detailLoading: false,

  formOpen: false,
  editingEvent: null,

  setViewMode: (mode) => { set({ viewMode: mode }); get().fetchEvents() },
  setListFilter: (f) => { set({ listFilter: f }); get().fetchEvents() },
  setSearch: (q) => { set({ search: q }); get().fetchEvents() },
  setCalendarMonth: (month) => { set({ calendarMonth: month }); get().fetchEvents() },

  fetchEvents: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('events:getAll', buildFilter(get()))
      if (result.success) {
        set({ events: result.data, loading: false })
      } else {
        set({ error: result.error ?? 'Failed to load events', loading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load events', loading: false })
    }
  },

  fetchEventDetail: async (id) => {
    set({ detailLoading: true })
    try {
      const result = await window.api.invoke('events:getDetail', { id })
      if (result.success) {
        set({ selectedEvent: result.data, detailLoading: false })
      } else {
        set({ detailLoading: false })
      }
    } catch {
      set({ detailLoading: false })
    }
  },

  clearDetail: () => set({ selectedEvent: null }),

  createEvent: async (payload) => {
    try {
      const result = await window.api.invoke('events:create', payload)
      if (result.success) {
        await get().fetchEvents()
        return result.data
      }
      set({ error: result.error ?? 'Failed to create event' })
      return null
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to create event' })
      return null
    }
  },

  updateEvent: async (id, payload) => {
    try {
      const result = await window.api.invoke('events:updateEvent', { id, ...payload })
      if (result.success) {
        await get().fetchEvents()
        if (get().selectedEvent?.event.id === id) {
          await get().fetchEventDetail(id)
        }
        return result.data
      }
      set({ error: result.error ?? 'Failed to update event' })
      return null
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to update event' })
      return null
    }
  },

  deleteEvent: async (id) => {
    const result = await window.api.invoke('events:deleteEvent', { id })
    if (!result.success) throw new Error(result.error ?? 'Failed to delete')
    if (get().selectedEvent?.event.id === id) {
      set({ selectedEvent: null })
    }
    await get().fetchEvents()
  },

  openForm: (event) => set({ formOpen: true, editingEvent: event ?? null }),
  closeForm: () => set({ formOpen: false, editingEvent: null }),

  exportAttendees: async (eventId) => {
    try {
      const result = await window.api.invoke('events:exportAttendees', { eventId })
      if (result.success) return result.data.csv
      return null
    } catch {
      return null
    }
  }
}))
