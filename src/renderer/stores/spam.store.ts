import { create } from 'zustand'
import type {
  SpamConfig,
  SpamEvent,
  SpamEventsFilter,
  RaidEvent,
  RaidState,
  SpamRule,
  SpamRulePayload
} from '@shared/spam-types'
import type { Platform } from '@shared/settings-types'

interface SpamState {
  // Config
  config: SpamConfig | null
  configLoading: boolean

  // Events
  events: readonly SpamEvent[]
  eventsLoading: boolean
  eventFilter: SpamEventsFilter

  // Raid
  raidState: RaidState
  raidEvents: readonly RaidEvent[]
  raidLoading: boolean

  // Rules
  rules: readonly SpamRule[]
  rulesLoading: boolean

  // Error
  error: string | null

  // Actions — config
  fetchConfig: () => Promise<void>
  updateConfig: (config: SpamConfig) => Promise<void>

  // Actions — events
  fetchEvents: (filter?: SpamEventsFilter) => Promise<void>
  setEventFilter: (filter: Partial<SpamEventsFilter>) => void

  // Actions — raid
  fetchRaidState: () => Promise<void>
  fetchRaidEvents: () => Promise<void>
  setManualLockdown: (enabled: boolean) => Promise<void>

  // Actions — rules
  fetchRules: () => Promise<void>
  saveRule: (payload: SpamRulePayload & { id?: number }) => Promise<void>
  deleteRule: (id: number) => Promise<void>
  toggleRule: (id: number, enabled: boolean) => Promise<void>

  // Actions — test
  testRule: (ruleType: string, content: string) => Promise<{ triggered: boolean; reason: string } | null>
}

export const useSpamStore = create<SpamState>((set, get) => ({
  config: null,
  configLoading: false,
  events: [],
  eventsLoading: false,
  eventFilter: {},
  raidState: 'normal',
  raidEvents: [],
  raidLoading: false,
  rules: [],
  rulesLoading: false,
  error: null,

  // -------------------------------------------------------------------------
  // Config
  // -------------------------------------------------------------------------

  fetchConfig: async () => {
    set({ configLoading: true, error: null })
    try {
      const result = await window.api.invoke('spam:getConfig')
      if (result.success) {
        set({ config: result.data, configLoading: false })
      } else {
        set({ error: result.error, configLoading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load config', configLoading: false })
    }
  },

  updateConfig: async (config) => {
    set({ configLoading: true, error: null })
    try {
      const result = await window.api.invoke('spam:updateConfig', config)
      if (result.success) {
        set({ config, configLoading: false })
      } else {
        set({ error: result.error, configLoading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to update config', configLoading: false })
    }
  },

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  fetchEvents: async (filter) => {
    const f = filter ?? get().eventFilter
    set({ eventsLoading: true, error: null, eventFilter: f })
    try {
      const result = await window.api.invoke('spam:getEvents', f)
      if (result.success) {
        set({ events: result.data, eventsLoading: false })
      } else {
        set({ error: result.error, eventsLoading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load events', eventsLoading: false })
    }
  },

  setEventFilter: (partial) => {
    const current = get().eventFilter
    const updated = { ...current, ...partial }
    set({ eventFilter: updated })
    get().fetchEvents(updated)
  },

  // -------------------------------------------------------------------------
  // Raid
  // -------------------------------------------------------------------------

  fetchRaidState: async () => {
    try {
      const result = await window.api.invoke('spam:getRaidState')
      if (result.success) {
        set({ raidState: result.data })
      }
    } catch {
      // Non-fatal
    }
  },

  fetchRaidEvents: async () => {
    set({ raidLoading: true })
    try {
      const result = await window.api.invoke('spam:getRaidEvents', { limit: 50 })
      if (result.success) {
        set({ raidEvents: result.data, raidLoading: false })
      } else {
        set({ raidLoading: false })
      }
    } catch {
      set({ raidLoading: false })
    }
  },

  setManualLockdown: async (enabled) => {
    try {
      const result = await window.api.invoke('spam:setManualLockdown', { enabled })
      if (result.success) {
        set({ raidState: enabled ? 'active' : 'normal' })
      }
    } catch {
      // Non-fatal
    }
  },

  // -------------------------------------------------------------------------
  // Rules
  // -------------------------------------------------------------------------

  fetchRules: async () => {
    set({ rulesLoading: true, error: null })
    try {
      const result = await window.api.invoke('spam:getRules')
      if (result.success) {
        set({ rules: result.data, rulesLoading: false })
      } else {
        set({ error: result.error, rulesLoading: false })
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load rules', rulesLoading: false })
    }
  },

  saveRule: async (payload) => {
    try {
      const result = await window.api.invoke('spam:saveRule', payload)
      if (result.success) {
        await get().fetchRules()
      }
    } catch {
      // Non-fatal
    }
  },

  deleteRule: async (id) => {
    try {
      const result = await window.api.invoke('spam:deleteRule', { id })
      if (result.success) {
        await get().fetchRules()
      }
    } catch {
      // Non-fatal
    }
  },

  toggleRule: async (id, enabled) => {
    try {
      const result = await window.api.invoke('spam:toggleRule', { id, enabled })
      if (result.success) {
        await get().fetchRules()
      }
    } catch {
      // Non-fatal
    }
  },

  // -------------------------------------------------------------------------
  // Test
  // -------------------------------------------------------------------------

  testRule: async (ruleType, content) => {
    try {
      const result = await window.api.invoke('spam:testRule', { ruleType, content })
      if (result.success) return result.data
      return null
    } catch {
      return null
    }
  }
}))
