import { useEffect } from 'react'

/**
 * Toggles `[data-window-inactive]` on `<html>` based on main-process focus
 * events. CSS reads this attribute to desaturate selection fills, dim
 * traffic lights' accent glow, and mute the accent color so the window
 * visibly recedes when not frontmost.
 *
 * Also listens to browser-level blur/focus as a fallback for environments
 * where the main-process IPC bridge is unavailable (e.g. unit tests).
 */
export function useWindowActive(): void {
  useEffect(() => {
    const root = document.documentElement

    const setInactive = (inactive: boolean): void => {
      if (inactive) {
        root.setAttribute('data-window-inactive', 'true')
      } else {
        root.removeAttribute('data-window-inactive')
      }
    }

    // Initial state: assume focused until told otherwise.
    setInactive(document.hasFocus() === false)

    const unsubscribeIpc = window.api.on('system:windowFocusChanged', (focused) => {
      setInactive(!focused)
    })

    const handleWindowBlur = (): void => setInactive(true)
    const handleWindowFocus = (): void => setInactive(false)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      unsubscribeIpc()
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])
}
