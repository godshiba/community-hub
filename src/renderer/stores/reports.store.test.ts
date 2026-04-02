import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useReportsStore } from './reports.store'

const mockReport: import('@shared/reports-types').SavedReport = {
  id: 1,
  title: 'Weekly Report',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-07',
  data: {
    config: { metrics: ['growth'], period: '7d', platformFilter: 'all' },
    periodStart: '2024-01-01',
    periodEnd: '2024-01-07',
    growth: {
      currentMembers: 100,
      previousMembers: 80,
      growthRate: 25,
      growthData: []
    }
  },
  createdAt: '2024-01-07'
}

describe('reports.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useReportsStore.setState({
      view: 'generator',
      period: '30d',
      platformFilter: 'all',
      selectedMetrics: ['growth', 'engagement', 'retention', 'moderation', 'events'],
      customStart: '',
      customEnd: '',
      currentReport: null,
      generating: false,
      reports: [],
      historyLoading: false,
      error: null,
      exporting: false
    })
  })

  it('has correct defaults', () => {
    const state = useReportsStore.getState()
    expect(state.view).toBe('generator')
    expect(state.period).toBe('30d')
    expect(state.selectedMetrics.length).toBe(5)
  })

  it('sets view', () => {
    useReportsStore.getState().setView('history')
    expect(useReportsStore.getState().view).toBe('history')
    expect(useReportsStore.getState().error).toBeNull()
  })

  it('sets period', () => {
    useReportsStore.getState().setPeriod('7d')
    expect(useReportsStore.getState().period).toBe('7d')
  })

  it('sets platform filter', () => {
    useReportsStore.getState().setPlatformFilter('discord')
    expect(useReportsStore.getState().platformFilter).toBe('discord')
  })

  it('toggles metrics', () => {
    useReportsStore.getState().toggleMetric('events')
    expect(useReportsStore.getState().selectedMetrics).not.toContain('events')

    useReportsStore.getState().toggleMetric('events')
    expect(useReportsStore.getState().selectedMetrics).toContain('events')
  })

  it('prevents removing last metric', () => {
    useReportsStore.setState({ selectedMetrics: ['growth'] })
    useReportsStore.getState().toggleMetric('growth')
    expect(useReportsStore.getState().selectedMetrics).toEqual(['growth'])
  })

  it('sets custom range', () => {
    useReportsStore.getState().setCustomRange('2024-01-01', '2024-01-31')
    expect(useReportsStore.getState().customStart).toBe('2024-01-01')
    expect(useReportsStore.getState().customEnd).toBe('2024-01-31')
  })

  it('generates report', async () => {
    mockIpcSuccess('reports:generate', mockReport)
    await useReportsStore.getState().generate()
    const state = useReportsStore.getState()
    expect(state.currentReport).toEqual(mockReport)
    expect(state.generating).toBe(false)
    expect(state.view).toBe('preview')
  })

  it('handles generate failure', async () => {
    mockIpcError('reports:generate', 'No data')
    await useReportsStore.getState().generate()
    expect(useReportsStore.getState().error).toBe('No data')
    expect(useReportsStore.getState().generating).toBe(false)
  })

  it('views a report', () => {
    useReportsStore.getState().viewReport(mockReport)
    expect(useReportsStore.getState().currentReport).toEqual(mockReport)
    expect(useReportsStore.getState().view).toBe('preview')
  })

  it('fetches history', async () => {
    mockIpcSuccess('reports:list', [mockReport])
    await useReportsStore.getState().fetchHistory()
    expect(useReportsStore.getState().reports).toEqual([mockReport])
    expect(useReportsStore.getState().historyLoading).toBe(false)
  })

  it('handles history error', async () => {
    mockIpcError('reports:list', 'DB error')
    await useReportsStore.getState().fetchHistory()
    expect(useReportsStore.getState().error).toBe('DB error')
  })

  it('deletes report and clears if current', async () => {
    useReportsStore.setState({ currentReport: mockReport })
    mockIpcSuccess('reports:delete', undefined as never)
    mockIpcSuccess('reports:list', [])

    await useReportsStore.getState().deleteReport(1)
    expect(useReportsStore.getState().currentReport).toBeNull()
    expect(useReportsStore.getState().view).toBe('generator')
  })

  it('loads report by id', async () => {
    mockIpcSuccess('reports:get', mockReport)
    await useReportsStore.getState().loadReport(1)
    expect(useReportsStore.getState().currentReport).toEqual(mockReport)
    expect(useReportsStore.getState().view).toBe('preview')
  })

  it('exports PDF', async () => {
    mockIpcSuccess('reports:exportPDF', { filePath: '/tmp/report.pdf' } as never)
    await useReportsStore.getState().exportPdf(1)
    expect(useReportsStore.getState().exporting).toBe(false)
  })

  it('handles export failure', async () => {
    mockIpcError('reports:exportPDF', 'Export failed')
    await useReportsStore.getState().exportPdf(1)
    expect(useReportsStore.getState().error).toBe('Export failed')
    expect(useReportsStore.getState().exporting).toBe(false)
  })

  it('clears error', () => {
    useReportsStore.setState({ error: 'Something broke' })
    useReportsStore.getState().clearError()
    expect(useReportsStore.getState().error).toBeNull()
  })

  it('handles generate exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useReportsStore.getState().generate()
    expect(useReportsStore.getState().error).toBe('Crash')
    expect(useReportsStore.getState().generating).toBe(false)
    installApiMock()
  })

  it('handles fetchHistory exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Net fail') } } },
      writable: true,
      configurable: true
    })
    await useReportsStore.getState().fetchHistory()
    expect(useReportsStore.getState().error).toBe('Net fail')
    installApiMock()
  })

  it('handles delete failure', async () => {
    mockIpcError('reports:delete', 'Not found')
    await useReportsStore.getState().deleteReport(999)
    expect(useReportsStore.getState().error).toBe('Not found')
  })

  it('handles delete exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Boom') } } },
      writable: true,
      configurable: true
    })
    await useReportsStore.getState().deleteReport(1)
    expect(useReportsStore.getState().error).toBe('Boom')
    installApiMock()
  })

  it('does not clear currentReport when deleting different report', async () => {
    useReportsStore.setState({ currentReport: mockReport })
    mockIpcSuccess('reports:delete', undefined as never)
    mockIpcSuccess('reports:list', [mockReport])
    await useReportsStore.getState().deleteReport(999)
    expect(useReportsStore.getState().currentReport).not.toBeNull()
  })

  it('handles loadReport failure', async () => {
    mockIpcError('reports:get', 'Not found')
    await useReportsStore.getState().loadReport(999)
    expect(useReportsStore.getState().error).toBe('Not found')
  })

  it('handles loadReport exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useReportsStore.getState().loadReport(1)
    expect(useReportsStore.getState().error).toBe('Crash')
    installApiMock()
  })

  it('handles exportPdf exception with cancelled message', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('User cancelled') } } },
      writable: true,
      configurable: true
    })
    await useReportsStore.getState().exportPdf(1)
    // 'cancelled' errors should be suppressed
    expect(useReportsStore.getState().error).toBeNull()
    installApiMock()
  })

  it('generates with custom range', async () => {
    useReportsStore.setState({ period: 'custom', customStart: '2024-01-01', customEnd: '2024-01-31' })
    mockIpcSuccess('reports:generate', mockReport)
    await useReportsStore.getState().generate()
    expect(useReportsStore.getState().currentReport).toEqual(mockReport)
  })
})
