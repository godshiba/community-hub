import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useAnalyticsStore } from './analytics.store'

const mockData = {
  stats: {
    totalMembers: { label: 'Total Members', value: 100, previousValue: 80, trend: 25 },
    growthRate: { label: 'Growth Rate', value: 25, previousValue: 0, trend: 25, unit: '%' },
    activeUsers: { label: 'Active Users', value: 25, previousValue: 20, trend: 25 },
    engagementRate: { label: 'Engagement Rate', value: 5, previousValue: 4, trend: 25, unit: '%' }
  },
  growth: [],
  heatmap: [],
  contributors: []
}

describe('analytics.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useAnalyticsStore.setState({
      data: null,
      period: 'week',
      platform: 'discord',
      customRange: null,
      loading: false,
      error: null
    })
  })

  it('has correct default state', () => {
    const state = useAnalyticsStore.getState()
    expect(state.period).toBe('week')
    expect(state.platform).toBe('discord')
    expect(state.data).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('fetches stats successfully', async () => {
    mockIpcSuccess('analytics:getStats', mockData)

    await useAnalyticsStore.getState().fetchStats()
    const state = useAnalyticsStore.getState()
    expect(state.data).toEqual(mockData)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('handles fetch error', async () => {
    mockIpcError('analytics:getStats', 'DB error')

    await useAnalyticsStore.getState().fetchStats()
    const state = useAnalyticsStore.getState()
    expect(state.error).toBe('DB error')
    expect(state.loading).toBe(false)
    expect(state.data).toBeNull()
  })

  it('sets period and triggers fetch', async () => {
    mockIpcSuccess('analytics:getStats', mockData)

    useAnalyticsStore.getState().setPeriod('month')
    expect(useAnalyticsStore.getState().period).toBe('month')
  })

  it('sets platform and triggers fetch', async () => {
    mockIpcSuccess('analytics:getStats', mockData)

    useAnalyticsStore.getState().setPlatform('telegram')
    expect(useAnalyticsStore.getState().platform).toBe('telegram')
  })

  it('sets custom range', async () => {
    mockIpcSuccess('analytics:getStats', mockData)

    const range = { start: '2024-01-01', end: '2024-01-31' }
    useAnalyticsStore.getState().setCustomRange(range)
    const state = useAnalyticsStore.getState()
    expect(state.customRange).toEqual(range)
    expect(state.period).toBe('custom')
  })

  it('syncs and fetches', async () => {
    mockIpcSuccess('analytics:syncNow', { synced: true } as never)
    mockIpcSuccess('analytics:getStats', mockData)

    await useAnalyticsStore.getState().syncNow()
    expect(useAnalyticsStore.getState().loading).toBe(false)
  })

  it('handles sync failure', async () => {
    mockIpcError('analytics:syncNow', 'Sync failed')

    await useAnalyticsStore.getState().syncNow()
    expect(useAnalyticsStore.getState().error).toBe('Sync failed')
  })

  it('handles fetch exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Network down') } } },
      writable: true,
      configurable: true
    })
    await useAnalyticsStore.getState().fetchStats()
    expect(useAnalyticsStore.getState().error).toBe('Network down')
    installApiMock()
  })

  it('handles sync exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Net fail') } } },
      writable: true,
      configurable: true
    })
    await useAnalyticsStore.getState().syncNow()
    expect(useAnalyticsStore.getState().error).toBe('Net fail')
    installApiMock()
  })
})
