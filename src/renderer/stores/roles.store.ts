import { create } from 'zustand'
import type { RoleRule, RoleRulePayload, RoleAssignment, PlatformRole } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

interface RolesState {
  rules: readonly RoleRule[]
  assignments: readonly RoleAssignment[]
  platformRoles: readonly PlatformRole[]
  loading: boolean
  error: string | null

  fetchRules: () => Promise<void>
  saveRule: (payload: RoleRulePayload & { id?: number }) => Promise<void>
  deleteRule: (id: number) => Promise<void>
  toggleRule: (id: number, enabled: boolean) => Promise<void>
  fetchPlatformRoles: (platform: Platform) => Promise<void>
  fetchAssignments: (memberId?: number) => Promise<void>
  assignRole: (memberId: number, roleId: string, roleName: string, durationHours: number | null) => Promise<void>
  removeRole: (assignmentId: number) => Promise<void>
}

export const useRolesStore = create<RolesState>((set, get) => ({
  rules: [],
  assignments: [],
  platformRoles: [],
  loading: false,
  error: null,

  fetchRules: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.invoke('roles:getRules', undefined)
      if (result.success) {
        set({ rules: result.data, loading: false })
      } else {
        set({ error: result.error ?? 'Failed to load rules', loading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load rules', loading: false })
    }
  },

  saveRule: async (payload) => {
    const result = await window.api.invoke('roles:saveRule', payload)
    if (!result.success) throw new Error(result.error ?? 'Failed to save rule')
    await get().fetchRules()
  },

  deleteRule: async (id) => {
    const result = await window.api.invoke('roles:deleteRule', { id })
    if (!result.success) throw new Error(result.error ?? 'Failed to delete rule')
    await get().fetchRules()
  },

  toggleRule: async (id, enabled) => {
    const result = await window.api.invoke('roles:toggleRule', { id, enabled })
    if (!result.success) throw new Error(result.error ?? 'Failed to toggle rule')
    await get().fetchRules()
  },

  fetchPlatformRoles: async (platform) => {
    try {
      const result = await window.api.invoke('roles:getRoles', { platform })
      if (result.success) {
        set({ platformRoles: result.data })
      }
    } catch {
      set({ platformRoles: [] })
    }
  },

  fetchAssignments: async (memberId) => {
    try {
      const result = await window.api.invoke('roles:getAssignments', { memberId })
      if (result.success) {
        set({ assignments: result.data })
      }
    } catch {
      // non-fatal
    }
  },

  assignRole: async (memberId, roleId, roleName, durationHours) => {
    const result = await window.api.invoke('roles:assignRole', { memberId, roleId, roleName, durationHours })
    if (!result.success) throw new Error(result.error ?? 'Failed to assign role')
    await get().fetchAssignments(memberId)
  },

  removeRole: async (assignmentId) => {
    const result = await window.api.invoke('roles:removeRole', { assignmentId })
    if (!result.success) throw new Error(result.error ?? 'Failed to remove role')
  }
}))
