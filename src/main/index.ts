import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { loadEnv } from './env'
import { initDatabase, closeDatabase } from './services/database.service'
import { registerWindowHandlers } from './ipc/window'
import { registerSettingsHandlers } from './ipc/settings'
import { initPlatformManager, getPlatformManager } from './services/platform-manager'

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
  createWindow()

  // Auto-connect platforms after window is up
  await manager.autoConnect()
})

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
