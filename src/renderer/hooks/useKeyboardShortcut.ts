import { useEffect, useRef } from 'react'

type ModKey = 'meta' | 'ctrl' | 'alt' | 'shift'

export interface ShortcutOptions {
  key: string
  modifiers?: ModKey[]
  preventDefault?: boolean
  enabled?: boolean
}

/**
 * Registers a global keydown listener for a keyboard shortcut.
 * The handler ref is stable so callers don't need to memoize it.
 */
export function useKeyboardShortcut(
  options: ShortcutOptions,
  handler: () => void
): void {
  const { key, modifiers = [], preventDefault = true, enabled = true } = options
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== key) return
      const needsMeta = modifiers.includes('meta')
      const needsCtrl = modifiers.includes('ctrl')
      const needsAlt = modifiers.includes('alt')
      const needsShift = modifiers.includes('shift')
      if (needsMeta !== e.metaKey) return
      if (needsCtrl !== e.ctrlKey) return
      if (needsAlt !== e.altKey) return
      if (needsShift !== e.shiftKey) return
      if (preventDefault) e.preventDefault()
      handlerRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, modifiers.join(','), preventDefault, enabled])
}
