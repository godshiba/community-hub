import { describe, it, expect, beforeEach } from 'vitest'
import { installApiMock, mockIpcSuccess, mockIpcError, clearApiMock } from '../../test/api-mock'
import { useModerationStore } from './moderation.store'

const mockMember = {
  id: 1,
  username: 'Alice',
  platform: 'discord' as const,
  platformUserId: 'u1',
  joinDate: '2024-01-01',
  status: 'active' as const,
  reputationScore: 0,
  warningsCount: 0,
  notes: null,
  lastActivity: '2024-06-01',
  createdAt: '2024-01-01'
}

const mockDetail = {
  member: mockMember,
  warnings: [],
  actions: []
}

describe('moderation.store', () => {
  beforeEach(() => {
    installApiMock()
    clearApiMock()
    useModerationStore.setState({
      members: [],
      total: 0,
      page: 1,
      pageSize: 50,
      loading: false,
      error: null,
      platform: undefined,
      status: undefined,
      search: '',
      sortBy: 'username',
      sortDir: 'asc',
      selectedMember: null,
      detailLoading: false
    })
  })

  it('fetches members', async () => {
    mockIpcSuccess('moderation:getMembers', {
      members: [mockMember],
      total: 1,
      page: 1,
      pageSize: 50
    })

    await useModerationStore.getState().fetchMembers()
    const state = useModerationStore.getState()
    expect(state.members).toEqual([mockMember])
    expect(state.total).toBe(1)
    expect(state.loading).toBe(false)
  })

  it('handles fetch error', async () => {
    mockIpcError('moderation:getMembers', 'DB error')
    await useModerationStore.getState().fetchMembers()
    expect(useModerationStore.getState().error).toBe('DB error')
  })

  it('sets platform filter and resets page', () => {
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    useModerationStore.setState({ page: 3 })
    useModerationStore.getState().setPlatform('telegram')
    expect(useModerationStore.getState().platform).toBe('telegram')
    expect(useModerationStore.getState().page).toBe(1)
  })

  it('sets status filter', () => {
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    useModerationStore.getState().setStatus('banned')
    expect(useModerationStore.getState().status).toBe('banned')
  })

  it('sets search filter', () => {
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    useModerationStore.getState().setSearch('alice')
    expect(useModerationStore.getState().search).toBe('alice')
  })

  it('sets sort', () => {
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    useModerationStore.getState().setSort('reputation_score', 'desc')
    expect(useModerationStore.getState().sortBy).toBe('reputation_score')
    expect(useModerationStore.getState().sortDir).toBe('desc')
  })

  it('fetches member detail', async () => {
    mockIpcSuccess('moderation:getMemberDetail', mockDetail)
    await useModerationStore.getState().fetchMemberDetail(1)
    expect(useModerationStore.getState().selectedMember).toEqual(mockDetail)
  })

  it('clears detail', () => {
    useModerationStore.setState({ selectedMember: mockDetail })
    useModerationStore.getState().clearDetail()
    expect(useModerationStore.getState().selectedMember).toBeNull()
  })

  it('warns member and refreshes', async () => {
    mockIpcSuccess('moderation:warnUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [mockMember], total: 1, page: 1, pageSize: 50 })
    await useModerationStore.getState().warnMember(1, 'Spam')
  })

  it('throws on warn failure', async () => {
    mockIpcError('moderation:warnUser', 'Not found')
    await expect(useModerationStore.getState().warnMember(999, 'Spam')).rejects.toThrow('Not found')
  })

  it('bans member', async () => {
    mockIpcSuccess('moderation:banUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    await useModerationStore.getState().banMember(1, 'Repeated violations')
  })

  it('unbans member', async () => {
    mockIpcSuccess('moderation:unbanUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [mockMember], total: 1, page: 1, pageSize: 50 })
    await useModerationStore.getState().unbanMember(1)
  })

  it('updates notes', async () => {
    mockIpcSuccess('moderation:updateNotes', undefined as never)
    await useModerationStore.getState().updateNotes(1, 'Great contributor')
  })

  it('syncs members', async () => {
    mockIpcSuccess('moderation:syncMembers', { synced: 15 })
    mockIpcSuccess('moderation:getMembers', { members: [mockMember], total: 1, page: 1, pageSize: 50 })
    const synced = await useModerationStore.getState().syncMembers()
    expect(synced).toBe(15)
  })

  it('handles sync failure', async () => {
    mockIpcError('moderation:syncMembers', 'Bot not connected')
    const synced = await useModerationStore.getState().syncMembers()
    expect(synced).toBe(0)
    expect(useModerationStore.getState().error).toBe('Bot not connected')
  })

  it('exports CSV', async () => {
    mockIpcSuccess('moderation:exportMembers', { csv: 'id,username\n1,Alice', count: 1 })
    const csv = await useModerationStore.getState().exportCsv()
    expect(csv).toBe('id,username\n1,Alice')
  })

  it('handles fetch exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Network down') } } },
      writable: true,
      configurable: true
    })
    await useModerationStore.getState().fetchMembers()
    expect(useModerationStore.getState().error).toBe('Network down')
    installApiMock()
  })

  it('handles fetchMemberDetail failure', async () => {
    mockIpcError('moderation:getMemberDetail', 'Not found')
    await useModerationStore.getState().fetchMemberDetail(999)
    expect(useModerationStore.getState().detailLoading).toBe(false)
  })

  it('handles fetchMemberDetail exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    await useModerationStore.getState().fetchMemberDetail(1)
    expect(useModerationStore.getState().detailLoading).toBe(false)
    installApiMock()
  })

  it('warns member refreshes detail if selected', async () => {
    useModerationStore.setState({ selectedMember: mockDetail })
    mockIpcSuccess('moderation:warnUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [mockMember], total: 1, page: 1, pageSize: 50 })
    mockIpcSuccess('moderation:getMemberDetail', mockDetail)
    await useModerationStore.getState().warnMember(1, 'Spam')
  })

  it('bans member refreshes detail if selected', async () => {
    useModerationStore.setState({ selectedMember: mockDetail })
    mockIpcSuccess('moderation:banUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 1, pageSize: 50 })
    mockIpcSuccess('moderation:getMemberDetail', mockDetail)
    await useModerationStore.getState().banMember(1, 'Bad')
  })

  it('unbans member refreshes detail if selected', async () => {
    useModerationStore.setState({ selectedMember: mockDetail })
    mockIpcSuccess('moderation:unbanUser', undefined as never)
    mockIpcSuccess('moderation:getMembers', { members: [mockMember], total: 1, page: 1, pageSize: 50 })
    mockIpcSuccess('moderation:getMemberDetail', mockDetail)
    await useModerationStore.getState().unbanMember(1)
  })

  it('updateNotes refreshes detail if selected', async () => {
    useModerationStore.setState({ selectedMember: mockDetail })
    mockIpcSuccess('moderation:updateNotes', undefined as never)
    mockIpcSuccess('moderation:getMemberDetail', mockDetail)
    await useModerationStore.getState().updateNotes(1, 'Great person')
  })

  it('handles sync exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    const synced = await useModerationStore.getState().syncMembers()
    expect(synced).toBe(0)
    installApiMock()
  })

  it('returns null on export failure', async () => {
    mockIpcError('moderation:exportMembers', 'Failed')
    const csv = await useModerationStore.getState().exportCsv()
    expect(csv).toBeNull()
  })

  it('returns null on export exception', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: { api: { invoke: () => { throw new Error('Crash') } } },
      writable: true,
      configurable: true
    })
    const csv = await useModerationStore.getState().exportCsv()
    expect(csv).toBeNull()
    installApiMock()
  })

  it('sets page', () => {
    mockIpcSuccess('moderation:getMembers', { members: [], total: 0, page: 2, pageSize: 50 })
    useModerationStore.getState().setPage(2)
    expect(useModerationStore.getState().page).toBe(2)
  })
})
