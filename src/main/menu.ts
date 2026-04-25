import { Menu, app } from 'electron'
import type { BrowserWindow, MenuItem, MenuItemConstructorOptions } from 'electron'
import type { MenuAction } from '@shared/system-types'

function send(win: BrowserWindow, action: MenuAction): void {
  if (!win.isDestroyed()) win.webContents.send('menu:action', action)
}

function navigate(win: BrowserWindow, panel: string): MenuItemConstructorOptions {
  return {
    click: () => send(win, { type: 'navigate', payload: panel })
  }
}

export function buildMenu(win: BrowserWindow): Menu {
  const template: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => send(win, { type: 'navigate', payload: 'settings' })
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Post',
          accelerator: 'CmdOrCtrl+N',
          click: () => send(win, { type: 'navigate', payload: 'scheduler' })
        },
        {
          label: 'New Event',
          accelerator: 'Shift+CmdOrCtrl+N',
          click: () => send(win, { type: 'navigate', payload: 'events' })
        },
        { type: 'separator' },
        {
          label: 'Generate Report...',
          accelerator: 'CmdOrCtrl+R',
          click: () => send(win, { type: 'navigate', payload: 'reports' })
        },
        {
          label: 'Sync Now',
          accelerator: 'Alt+CmdOrCtrl+S',
          click: () => send(win, { type: 'syncNow' })
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => send(win, { type: 'toggleSidebar' })
        },
        {
          label: 'Toggle Inspector',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: () => send(win, { type: 'toggleInspector' })
        },
        { type: 'separator' },
        { label: 'Go to Dashboard', accelerator: 'CmdOrCtrl+1', ...navigate(win, 'dashboard') },
        { label: 'Go to Moderation', accelerator: 'CmdOrCtrl+2', ...navigate(win, 'moderation') },
        { label: 'Go to Events', accelerator: 'CmdOrCtrl+3', ...navigate(win, 'events') },
        { label: 'Go to Scheduler', accelerator: 'CmdOrCtrl+4', ...navigate(win, 'scheduler') },
        { label: 'Go to Agent', accelerator: 'CmdOrCtrl+5', ...navigate(win, 'agent') },
        { label: 'Go to Reports', accelerator: 'CmdOrCtrl+6', ...navigate(win, 'reports') },
        { label: 'Go to Settings', accelerator: 'CmdOrCtrl+7', ...navigate(win, 'settings') },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Community Hub Help',
          click: () => { /* reserved */ }
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => send(win, { type: 'openCommandPalette' })
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
