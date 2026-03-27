import { BrowserWindow } from 'electron'
import { registerHandler } from './register-handler'

export function registerWindowHandlers(): void {
  registerHandler('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  registerHandler('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  registerHandler('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  registerHandler('app:ping', () => {
    return { pong: true as const, timestamp: Date.now() }
  })
}
