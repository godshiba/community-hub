import { app } from 'electron'

let currentBadge = ''

/**
 * Updates the macOS dock badge to reflect the given count.
 * Pass 0 to clear the badge.
 */
export function setDockBadge(count: number): void {
  if (process.platform !== 'darwin') return
  const label = count > 0 ? String(count) : ''
  if (label === currentBadge) return
  currentBadge = label
  app.dock.setBadge(label)
}
