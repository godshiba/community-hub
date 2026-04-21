import { app, systemPreferences, BrowserWindow } from 'electron'
import { registerHandler } from './register-handler'
import type { PlatformName } from '@shared/system-types'

type AccentSubscriberId = number | null

/**
 * Returns the current system accent color as `#rrggbb`, or `null` when the
 * user has selected the macOS "Graphite" (multicolor) accent. Callers treat
 * `null` by falling back to a neutral grey via the [data-accent="graphite"]
 * CSS attribute.
 */
export function getCurrentAccentColor(): string | null {
  if (process.platform !== 'darwin') {
    const hex = systemPreferences.getAccentColor?.() ?? ''
    return hex ? `#${hex.slice(0, 6)}` : null
  }

  // macOS: `AppleAccentColor` user default encodes the chosen accent.
  // Missing / empty string = Graphite (multicolor).
  // Values 0-6 map to red/orange/yellow/green/blue/purple/pink.
  const raw = systemPreferences.getUserDefault('AppleAccentColor', 'string')
  if (raw === '' || raw === '-1') return null

  const hex = systemPreferences.getAccentColor?.() ?? ''
  if (!hex) return null
  // macOS returns `rrggbbaa`. Strip alpha.
  return `#${hex.slice(0, 6)}`
}

function getPlatformName(): PlatformName {
  if (process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux') {
    return process.platform
  }
  return 'linux'
}

export function registerSystemHandlers(): void {
  registerHandler('system:getAccentColor', () => getCurrentAccentColor())
  registerHandler('system:getUserLocale', () => app.getLocale())
  registerHandler('system:getPlatform', () => getPlatformName())
}

let accentSubscriberId: AccentSubscriberId = null

/**
 * Wire main-process events for the shell: accent-color changes, window focus,
 * and fullscreen state. Call this immediately after `createWindow()`.
 *
 * Returns a disposer that unsubscribes the accent listener; call on app quit
 * or window close to avoid leaking `systemPreferences` notification IDs.
 */
export function wireSystemEvents(win: BrowserWindow): () => void {
  // Accent color changes — macOS only (AppKit notification).
  if (process.platform === 'darwin') {
    accentSubscriberId = systemPreferences.subscribeNotification(
      'AppleColorPreferencesChangedNotification',
      () => {
        if (win.isDestroyed()) return
        win.webContents.send('system:accentChanged', getCurrentAccentColor())
      }
    )
  }

  const sendFocus = (focused: boolean): void => {
    if (win.isDestroyed()) return
    win.webContents.send('system:windowFocusChanged', focused)
  }
  win.on('focus', () => sendFocus(true))
  win.on('blur', () => sendFocus(false))

  const sendFullscreen = (isFullscreen: boolean): void => {
    if (win.isDestroyed()) return
    win.webContents.send('system:fullscreenChanged', isFullscreen)
  }
  win.on('enter-full-screen', () => sendFullscreen(true))
  win.on('leave-full-screen', () => sendFullscreen(false))

  return () => {
    if (accentSubscriberId !== null && process.platform === 'darwin') {
      systemPreferences.unsubscribeNotification(accentSubscriberId)
      accentSubscriberId = null
    }
  }
}
