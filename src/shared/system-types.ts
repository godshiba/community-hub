/**
 * System-level types for the main → renderer bridge.
 * See docs/plan-v1/ui-upgrade.md § Main-Process Changes.
 */

export type PlatformName = 'darwin' | 'win32' | 'linux'

export type MenuActionType =
  | 'navigate'
  | 'toggleSidebar'
  | 'toggleInspector'
  | 'openCommandPalette'
  | 'openShortcutsSheet'
  | 'syncNow'
  | 'newPost'
  | 'newEvent'
  | 'generateReport'
  | 'focusSearch'

export interface MenuAction {
  type: MenuActionType
  payload?: string
}

/** Map of system events pushed from main to renderer. */
export interface SystemEventMap {
  /** Accent color changed in System Settings. `null` = Graphite (multicolor). */
  'system:accentChanged': string | null
  /** Window focus state changed. `true` = focused. */
  'system:windowFocusChanged': boolean
  /** Fullscreen state changed. `true` = entered fullscreen. */
  'system:fullscreenChanged': boolean
  /** App menu action dispatched from native menu bar. */
  'menu:action': MenuAction
}

export type SystemEvent = keyof SystemEventMap
