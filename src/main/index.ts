import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { loadEnv } from './env'
import { initDatabase, closeDatabase } from './services/database.service'
import { registerWindowHandlers } from './ipc/window'
import { registerSettingsHandlers } from './ipc/settings'
import { initPlatformManager } from './services/platform-manager'
import { getStats } from './services/analytics.repository'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 10 },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  loadEnv()
  initDatabase()

  const manager = initPlatformManager()
  registerWindowHandlers()
  registerSettingsHandlers()
  registerAnalyticsHandlers()
  createWindow()

  // Auto-connect platforms after window is up
  await manager.autoConnect()

  // Start background stats sync (lazy import to avoid module-level issues)
  import('./tasks/stats-sync').then((m) => m.startStatsSync()).catch(() => {})
})

function registerAnalyticsHandlers(): void {
  ipcMain.removeHandler('analytics:getStats')
  ipcMain.handle('analytics:getStats', async (_event, payload) => {
    try {
      return { success: true, data: getStats(payload) }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.removeHandler('analytics:syncNow')
  ipcMain.handle('analytics:syncNow', async () => {
    try {
      const { syncStats } = await import('./tasks/stats-sync')
      const result = await syncStats()
      return { success: true, data: result }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.removeHandler('analytics:exportStats')
  ipcMain.handle('analytics:exportStats', async () => {
    return { success: false, error: 'Export not yet available' }
  })
}

app.on('window-all-closed', () => {
  try { getPlatformManager().disconnectAll() } catch { /* not initialized */ }
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
