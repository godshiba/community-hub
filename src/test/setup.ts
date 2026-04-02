import { vi } from 'vitest'

// Mock Electron's app module for database.service.ts
vi.mock('electron', () => ({
  app: {
    getPath: (key: string) => {
      if (key === 'home') return '/tmp/community-hub-test'
      return '/tmp'
    },
    isPackaged: false
  },
  ipcMain: {
    handle: vi.fn()
  }
}))
