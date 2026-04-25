import { Notification } from 'electron'
import { getMainWindow } from '../index'
import type { PanelId } from '@shared/types'

export interface AppNotificationOptions {
  title: string
  body?: string
  navigateTo?: PanelId
}

/**
 * Shows a native macOS notification.
 * Clicking it focuses the main window and optionally navigates to a panel.
 */
export function showNotification(options: AppNotificationOptions): void {
  if (!Notification.isSupported()) return

  const n = new Notification({
    title: options.title,
    body: options.body ?? ''
  })

  n.on('click', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
    if (options.navigateTo) {
      win.webContents.send('menu:action', {
        type: 'navigate',
        payload: options.navigateTo
      })
    }
  })

  n.show()
}
