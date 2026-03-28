import { create } from 'zustand'
import type { PlatformStatus, ConnectionStatus } from '@shared/settings-types'

interface ConnectionState {
  discord: ConnectionStatus
  telegram: ConnectionStatus

  setStatus: (status: PlatformStatus) => void
  fetchStatus: () => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  discord: 'disconnected',
  telegram: 'disconnected',

  setStatus: (status) =>
    set({ discord: status.discord, telegram: status.telegram }),

  fetchStatus: async () => {
    const result = await window.api.invoke('settings:getPlatformStatus')
    if (result.success) {
      set({ discord: result.data.discord, telegram: result.data.telegram })
    }
  }
}))
