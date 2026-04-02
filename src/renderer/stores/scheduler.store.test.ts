import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useSchedulerStore } from './scheduler.store'

const mockPost = {
  id: 1,
  title: 'Test Post',
  content: 'Hello',
  platforms: ['discord' as const],
  channelIds: {},
  scheduledTime: null,
  sentTime: null,
  status: 'draft' as const,
  errorMessage: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
}

describe('scheduler.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useSchedulerStore.setState({
      queue: [],
      history: [],
      channels: [],
      tab: 'queue',
      loading: false,
      error: null
    })
  })

  it('has correct defaults', () => {
    const state = useSchedulerStore.getState()
    expect(state.tab).toBe('queue')
    expect(state.queue).toEqual([])
  })

  it('sets tab and fetches history when switching to history', async () => {
    mockIpcSuccess('scheduler:getHistory', [])
    useSchedulerStore.getState().setTab('history')
    expect(useSchedulerStore.getState().tab).toBe('history')
  })

  it('fetches queue', async () => {
    mockIpcSuccess('scheduler:getQueue', [mockPost])
    await useSchedulerStore.getState().fetchQueue()
    expect(useSchedulerStore.getState().queue).toEqual([mockPost])
  })

  it('fetches channels', async () => {
    const channels = [{ id: 'ch-1', name: 'general', platform: 'discord' as const }]
    mockIpcSuccess('scheduler:getChannels', channels)
    await useSchedulerStore.getState().fetchChannels()
    expect(useSchedulerStore.getState().channels).toEqual(channels)
  })

  it('creates post and refreshes queue', async () => {
    mockIpcSuccess('scheduler:createPost', mockPost)
    mockIpcSuccess('scheduler:getQueue', [mockPost])

    const result = await useSchedulerStore.getState().createPost({
      title: 'Test Post',
      content: 'Hello',
      platforms: ['discord'],
      channelIds: {},
      scheduledTime: null
    })
    expect(result).toEqual(mockPost)
    expect(useSchedulerStore.getState().loading).toBe(false)
  })

  it('handles create failure', async () => {
    mockIpcError('scheduler:createPost', 'Validation error')
    const result = await useSchedulerStore.getState().createPost({
      title: '',
      content: '',
      platforms: [],
      channelIds: {},
      scheduledTime: null
    })
    expect(result).toBeNull()
    expect(useSchedulerStore.getState().error).toBe('Validation error')
  })

  it('updates post', async () => {
    const updated = { ...mockPost, title: 'Updated' }
    mockIpcSuccess('scheduler:updatePost', updated)
    mockIpcSuccess('scheduler:getQueue', [updated])

    const result = await useSchedulerStore.getState().updatePost(1, {
      title: 'Updated',
      content: 'Hello',
      platforms: ['discord'],
      channelIds: {},
      scheduledTime: null
    })
    expect(result!.title).toBe('Updated')
  })

  it('cancels post', async () => {
    mockIpcSuccess('scheduler:cancelPost', undefined as never)
    mockIpcSuccess('scheduler:getQueue', [])
    await useSchedulerStore.getState().cancelPost(1)
    expect(useSchedulerStore.getState().queue).toEqual([])
  })

  it('sends post now', async () => {
    mockIpcSuccess('scheduler:sendNow', { success: true, platforms: [] })
    mockIpcSuccess('scheduler:getQueue', [])
    mockIpcSuccess('scheduler:getHistory', [])
    await useSchedulerStore.getState().sendNow(1)
    expect(useSchedulerStore.getState().loading).toBe(false)
  })

  it('handles send failure', async () => {
    mockIpcError('scheduler:sendNow', 'Bot not connected')
    await useSchedulerStore.getState().sendNow(1)
    expect(useSchedulerStore.getState().error).toBe('Bot not connected')
  })

  it('handles create exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    const result = await useSchedulerStore.getState().createPost({
      title: 'X', content: 'X', platforms: [], channelIds: {}, scheduledTime: null
    })
    expect(result).toBeNull()
    expect(useSchedulerStore.getState().error).toBe('Crash')
    installApiMock()
  })

  it('handles update failure', async () => {
    mockIpcError('scheduler:updatePost', 'Not found')
    const result = await useSchedulerStore.getState().updatePost(999, {
      title: 'X', content: 'X', platforms: [], channelIds: {}, scheduledTime: null
    })
    expect(result).toBeNull()
    expect(useSchedulerStore.getState().error).toBe('Not found')
  })

  it('handles update exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Boom') } } },
      writable: true,
      configurable: true
    })
    const result = await useSchedulerStore.getState().updatePost(1, {
      title: 'X', content: 'X', platforms: [], channelIds: {}, scheduledTime: null
    })
    expect(result).toBeNull()
    installApiMock()
  })

  it('handles sendNow exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Net fail') } } },
      writable: true,
      configurable: true
    })
    await useSchedulerStore.getState().sendNow(1)
    expect(useSchedulerStore.getState().error).toBe('Net fail')
    installApiMock()
  })

  it('handles fetchQueue exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useSchedulerStore.getState().fetchQueue()
    expect(useSchedulerStore.getState().queue).toEqual([])
    installApiMock()
  })

  it('handles fetchHistory exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useSchedulerStore.getState().fetchHistory()
    expect(useSchedulerStore.getState().history).toEqual([])
    installApiMock()
  })

  it('handles fetchChannels exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useSchedulerStore.getState().fetchChannels()
    expect(useSchedulerStore.getState().channels).toEqual([])
    installApiMock()
  })
})
