import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useAgentStore } from './agent.store'

const mockStatus = {
  state: 'running' as const,
  provider: 'claude',
  respondMode: 'mentioned' as const,
  actionsToday: 5,
  pendingApproval: 2
}

const mockProfile = {
  id: 1,
  name: 'CommunityBot',
  role: 'moderator',
  tone: 'friendly',
  knowledge: null,
  boundaries: null,
  language: 'en',
  respondMode: 'mentioned' as const,
  updatedAt: '2024-01-01'
}

describe('agent.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useAgentStore.setState({
      status: null,
      statusLoading: false,
      actions: [],
      actionsLoading: false,
      filterType: undefined,
      filterPlatform: undefined,
      filterStatus: undefined,
      profile: null,
      patterns: [],
      automations: [],
      error: null
    })
  })

  it('fetches status', async () => {
    mockIpcSuccess('agent:getStatus', mockStatus)
    await useAgentStore.getState().fetchStatus()
    expect(useAgentStore.getState().status).toEqual(mockStatus)
    expect(useAgentStore.getState().statusLoading).toBe(false)
  })

  it('handles status error', async () => {
    mockIpcError('agent:getStatus', 'No provider')
    await useAgentStore.getState().fetchStatus()
    expect(useAgentStore.getState().error).toBe('No provider')
  })

  it('fetches actions with filters', async () => {
    const mockActions = [{ id: 1, actionType: 'replied', platform: 'discord', context: null, input: 'hi', output: 'hello', status: 'completed', correction: null, createdAt: '2024-01-01' }]
    mockIpcSuccess('agent:getActions', mockActions as never)
    await useAgentStore.getState().fetchActions()
    expect(useAgentStore.getState().actions.length).toBe(1)
  })

  it('sets filters and triggers fetch', () => {
    mockIpcSuccess('agent:getActions', [])
    useAgentStore.getState().setFilterType('replied')
    expect(useAgentStore.getState().filterType).toBe('replied')

    useAgentStore.getState().setFilterPlatform('discord')
    expect(useAgentStore.getState().filterPlatform).toBe('discord')

    useAgentStore.getState().setFilterStatus('pending')
    expect(useAgentStore.getState().filterStatus).toBe('pending')
  })

  it('approves action', async () => {
    mockIpcSuccess('agent:approve', undefined as never)
    mockIpcSuccess('agent:getActions', [])
    mockIpcSuccess('agent:getStatus', mockStatus)
    await useAgentStore.getState().approveAction(1)
  })

  it('rejects action', async () => {
    mockIpcSuccess('agent:reject', undefined as never)
    mockIpcSuccess('agent:getActions', [])
    mockIpcSuccess('agent:getStatus', mockStatus)
    await useAgentStore.getState().rejectAction(1)
  })

  it('edits action', async () => {
    mockIpcSuccess('agent:editAction', undefined as never)
    mockIpcSuccess('agent:getActions', [])
    await useAgentStore.getState().editAction(1, 'New response')
  })

  it('pauses and resumes agent', async () => {
    mockIpcSuccess('agent:pause', undefined as never)
    mockIpcSuccess('agent:resume', undefined as never)
    mockIpcSuccess('agent:getStatus', mockStatus)

    await useAgentStore.getState().pause()
    await useAgentStore.getState().resume()
  })

  it('fetches and updates profile', async () => {
    mockIpcSuccess('agent:getProfile', mockProfile)
    await useAgentStore.getState().fetchProfile()
    expect(useAgentStore.getState().profile).toEqual(mockProfile)

    const updated = { ...mockProfile, name: 'Updated Bot' }
    mockIpcSuccess('agent:updateProfile', updated)
    await useAgentStore.getState().updateProfile({ name: 'Updated Bot' })
    expect(useAgentStore.getState().profile!.name).toBe('Updated Bot')
  })

  it('manages patterns', async () => {
    const pattern = { id: 1, triggerType: 'keyword', triggerValue: 'hello', responseTemplate: 'Hi!', platform: null, enabled: true, usageCount: 0, lastUsed: null, createdAt: '2024-01-01' }
    mockIpcSuccess('agent:getPatterns', [pattern] as never)
    await useAgentStore.getState().fetchPatterns()
    expect(useAgentStore.getState().patterns.length).toBe(1)

    mockIpcSuccess('agent:savePattern', pattern as never)
    mockIpcSuccess('agent:getPatterns', [pattern] as never)
    await useAgentStore.getState().savePattern({ triggerType: 'keyword', triggerValue: 'hello', responseTemplate: 'Hi!' })

    mockIpcSuccess('agent:deletePattern', undefined as never)
    mockIpcSuccess('agent:getPatterns', [])
    await useAgentStore.getState().deletePattern(1)
  })

  it('manages automations', async () => {
    const automation = { id: 1, name: 'Welcome', trigger: { type: 'new_member', value: '' }, action: { type: 'reply', payload: {} }, platform: null, enabled: true, lastTriggered: null, createdAt: '2024-01-01' }
    mockIpcSuccess('agent:getAutomations', [automation] as never)
    await useAgentStore.getState().fetchAutomations()
    expect(useAgentStore.getState().automations.length).toBe(1)

    mockIpcSuccess('agent:toggleAutomation', undefined as never)
    mockIpcSuccess('agent:getAutomations', [{ ...automation, enabled: false }] as never)
    await useAgentStore.getState().toggleAutomation(1, false)

    mockIpcSuccess('agent:deleteAutomation', undefined as never)
    mockIpcSuccess('agent:getAutomations', [])
    await useAgentStore.getState().deleteAutomation(1)
  })

  it('tests provider', async () => {
    mockIpcSuccess('agent:testProvider', { success: true })
    const result = await useAgentStore.getState().testProvider()
    expect(result.success).toBe(true)
  })

  it('returns error on provider test failure', async () => {
    mockIpcError('agent:testProvider', 'Invalid API key')
    const result = await useAgentStore.getState().testProvider()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid API key')
  })

  it('handles fetchStatus exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useAgentStore.getState().fetchStatus()
    expect(useAgentStore.getState().statusLoading).toBe(false)
    installApiMock()
  })

  it('handles fetchActions error', async () => {
    mockIpcError('agent:getActions', 'DB error')
    await useAgentStore.getState().fetchActions()
    expect(useAgentStore.getState().error).toBe('DB error')
  })

  it('handles fetchActions exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useAgentStore.getState().fetchActions()
    expect(useAgentStore.getState().actionsLoading).toBe(false)
    installApiMock()
  })

  it('handles fetchProfile exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useAgentStore.getState().fetchProfile()
    expect(useAgentStore.getState().profile).toBeNull()
    installApiMock()
  })

  it('handles fetchPatterns exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useAgentStore.getState().fetchPatterns()
    expect(useAgentStore.getState().patterns).toEqual([])
    installApiMock()
  })

  it('handles fetchAutomations exception silently', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('X') } } },
      writable: true,
      configurable: true
    })
    await useAgentStore.getState().fetchAutomations()
    expect(useAgentStore.getState().automations).toEqual([])
    installApiMock()
  })

  it('saves automation and refreshes', async () => {
    mockIpcSuccess('agent:saveAutomation', {} as never)
    mockIpcSuccess('agent:getAutomations', [])
    await useAgentStore.getState().saveAutomation({
      name: 'Test', trigger: { type: 'keyword', value: 'hi' },
      action: { type: 'reply', payload: {} }
    })
  })
})
