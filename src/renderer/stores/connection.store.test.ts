import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useConnectionStore } from './connection.store'

describe('connection.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useConnectionStore.setState({
      discord: 'disconnected',
      telegram: 'disconnected'
    })
  })

  it('starts with disconnected status', () => {
    const state = useConnectionStore.getState()
    expect(state.discord).toBe('disconnected')
    expect(state.telegram).toBe('disconnected')
  })

  it('sets status directly', () => {
    useConnectionStore.getState().setStatus({
      discord: 'connected',
      telegram: 'error'
    })
    const state = useConnectionStore.getState()
    expect(state.discord).toBe('connected')
    expect(state.telegram).toBe('error')
  })

  it('fetches status from IPC', async () => {
    mockIpcSuccess('settings:getPlatformStatus', {
      discord: 'connected',
      telegram: 'connected'
    })

    await useConnectionStore.getState().fetchStatus()
    const state = useConnectionStore.getState()
    expect(state.discord).toBe('connected')
    expect(state.telegram).toBe('connected')
  })

  it('handles IPC failure gracefully', async () => {
    mockIpcError('settings:getPlatformStatus', 'Network error')
    await useConnectionStore.getState().fetchStatus()
    // Should remain disconnected
    expect(useConnectionStore.getState().discord).toBe('disconnected')
  })
})
