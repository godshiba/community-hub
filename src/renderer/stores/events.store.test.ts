import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useEventsStore } from './events.store'

const mockEvent = {
  id: 1,
  title: 'Meetup',
  description: 'A fun event',
  eventDate: '2025-06-15T18:00:00Z',
  eventTime: '18:00',
  location: 'Discord Stage',
  platform: 'discord' as const,
  capacity: 50,
  status: 'upcoming' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
}

const mockDetail = {
  event: mockEvent,
  rsvps: [],
  reminders: [],
  rsvpCounts: { yes: 0, no: 0, maybe: 0 }
}

describe('events.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useEventsStore.setState({
      events: [],
      loading: false,
      error: null,
      viewMode: 'list',
      listFilter: 'upcoming',
      search: '',
      selectedEvent: null,
      detailLoading: false,
      formOpen: false,
      editingEvent: null
    })
  })

  it('has correct defaults', () => {
    const state = useEventsStore.getState()
    expect(state.viewMode).toBe('list')
    expect(state.listFilter).toBe('upcoming')
    expect(state.events).toEqual([])
  })

  it('fetches events', async () => {
    mockIpcSuccess('events:getAll', [mockEvent])
    await useEventsStore.getState().fetchEvents()
    expect(useEventsStore.getState().events).toEqual([mockEvent])
    expect(useEventsStore.getState().loading).toBe(false)
  })

  it('handles fetch error', async () => {
    mockIpcError('events:getAll', 'DB error')
    await useEventsStore.getState().fetchEvents()
    expect(useEventsStore.getState().error).toBe('DB error')
  })

  it('sets view mode and triggers fetch', () => {
    mockIpcSuccess('events:getAll', [])
    useEventsStore.getState().setViewMode('calendar')
    expect(useEventsStore.getState().viewMode).toBe('calendar')
  })

  it('sets list filter', () => {
    mockIpcSuccess('events:getAll', [])
    useEventsStore.getState().setListFilter('past')
    expect(useEventsStore.getState().listFilter).toBe('past')
  })

  it('sets search', () => {
    mockIpcSuccess('events:getAll', [])
    useEventsStore.getState().setSearch('meetup')
    expect(useEventsStore.getState().search).toBe('meetup')
  })

  it('fetches event detail', async () => {
    mockIpcSuccess('events:getDetail', mockDetail)
    await useEventsStore.getState().fetchEventDetail(1)
    expect(useEventsStore.getState().selectedEvent).toEqual(mockDetail)
    expect(useEventsStore.getState().detailLoading).toBe(false)
  })

  it('clears detail', () => {
    useEventsStore.setState({ selectedEvent: mockDetail })
    useEventsStore.getState().clearDetail()
    expect(useEventsStore.getState().selectedEvent).toBeNull()
  })

  it('creates event', async () => {
    mockIpcSuccess('events:create', mockEvent)
    mockIpcSuccess('events:getAll', [mockEvent])

    const result = await useEventsStore.getState().createEvent({
      title: 'Meetup',
      description: 'A fun event',
      eventDate: '2025-06-15T18:00:00Z',
      eventTime: '18:00',
      location: 'Discord Stage',
      platform: 'discord',
      capacity: 50,
      status: 'upcoming',
      reminders: []
    })
    expect(result).toEqual(mockEvent)
  })

  it('handles create failure', async () => {
    mockIpcError('events:create', 'Validation error')
    const result = await useEventsStore.getState().createEvent({
      title: '',
      description: null,
      eventDate: '',
      eventTime: null,
      location: null,
      platform: null,
      capacity: null,
      status: 'draft',
      reminders: []
    })
    expect(result).toBeNull()
    expect(useEventsStore.getState().error).toBe('Validation error')
  })

  it('deletes event and clears detail if selected', async () => {
    useEventsStore.setState({ selectedEvent: mockDetail })
    mockIpcSuccess('events:deleteEvent', undefined as never)
    mockIpcSuccess('events:getAll', [])

    await useEventsStore.getState().deleteEvent(1)
    expect(useEventsStore.getState().selectedEvent).toBeNull()
  })

  it('opens and closes form', () => {
    useEventsStore.getState().openForm(mockEvent)
    expect(useEventsStore.getState().formOpen).toBe(true)
    expect(useEventsStore.getState().editingEvent).toEqual(mockEvent)

    useEventsStore.getState().closeForm()
    expect(useEventsStore.getState().formOpen).toBe(false)
    expect(useEventsStore.getState().editingEvent).toBeNull()
  })

  it('exports attendees', async () => {
    mockIpcSuccess('events:exportAttendees', { csv: 'id,name\n1,Alice', count: 1 })
    const csv = await useEventsStore.getState().exportAttendees(1)
    expect(csv).toBe('id,name\n1,Alice')
  })

  it('returns null on export failure', async () => {
    mockIpcError('events:exportAttendees', 'Not found')
    const csv = await useEventsStore.getState().exportAttendees(999)
    expect(csv).toBeNull()
  })

  it('handles fetch exception', async () => {
    // Simulate throw instead of IPC error
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Network down') } } },
      writable: true,
      configurable: true
    })
    await useEventsStore.getState().fetchEvents()
    expect(useEventsStore.getState().error).toBe('Network down')
    // Restore mock
    installApiMock()
  })

  it('handles create exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    const result = await useEventsStore.getState().createEvent({
      title: 'X', description: null, eventDate: '', eventTime: null,
      location: null, platform: null, capacity: null, status: 'draft', reminders: []
    })
    expect(result).toBeNull()
    installApiMock()
  })

  it('handles update event success with detail refresh', async () => {
    useEventsStore.setState({ selectedEvent: mockDetail })
    const updatedEvent = { ...mockEvent, title: 'Updated' }
    mockIpcSuccess('events:updateEvent', updatedEvent)
    mockIpcSuccess('events:getAll', [updatedEvent])
    mockIpcSuccess('events:getDetail', { ...mockDetail, event: updatedEvent })
    const result = await useEventsStore.getState().updateEvent(1, {
      title: 'Updated', description: null, eventDate: '2025-06-15',
      eventTime: null, location: null, platform: null, capacity: null,
      status: 'upcoming', reminders: []
    })
    expect(result!.title).toBe('Updated')
  })

  it('handles update event failure', async () => {
    mockIpcError('events:updateEvent', 'Not found')
    const result = await useEventsStore.getState().updateEvent(999, {
      title: 'X', description: null, eventDate: '', eventTime: null,
      location: null, platform: null, capacity: null, status: 'draft', reminders: []
    })
    expect(result).toBeNull()
    expect(useEventsStore.getState().error).toBe('Not found')
  })

  it('handles update exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Boom') } } },
      writable: true,
      configurable: true
    })
    const result = await useEventsStore.getState().updateEvent(1, {
      title: 'X', description: null, eventDate: '', eventTime: null,
      location: null, platform: null, capacity: null, status: 'draft', reminders: []
    })
    expect(result).toBeNull()
    installApiMock()
  })

  it('handles fetchEventDetail failure', async () => {
    mockIpcError('events:getDetail', 'Not found')
    await useEventsStore.getState().fetchEventDetail(999)
    expect(useEventsStore.getState().detailLoading).toBe(false)
  })

  it('handles fetchEventDetail exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useEventsStore.getState().fetchEventDetail(1)
    expect(useEventsStore.getState().detailLoading).toBe(false)
    installApiMock()
  })

  it('handles export exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    const csv = await useEventsStore.getState().exportAttendees(1)
    expect(csv).toBeNull()
    installApiMock()
  })

  it('sets calendar month', () => {
    mockIpcSuccess('events:getAll', [])
    useEventsStore.getState().setCalendarMonth('2025-03')
    expect(useEventsStore.getState().calendarMonth).toBe('2025-03')
  })

  it('opens form without event for creation', () => {
    useEventsStore.getState().openForm()
    expect(useEventsStore.getState().formOpen).toBe(true)
    expect(useEventsStore.getState().editingEvent).toBeNull()
  })

  it('delete does not clear detail if different event', async () => {
    const otherDetail = { ...mockDetail, event: { ...mockEvent, id: 2 } }
    useEventsStore.setState({ selectedEvent: otherDetail })
    mockIpcSuccess('events:deleteEvent', undefined as never)
    mockIpcSuccess('events:getAll', [])
    await useEventsStore.getState().deleteEvent(1)
    expect(useEventsStore.getState().selectedEvent).not.toBeNull()
  })
})
