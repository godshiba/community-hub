import { useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import type { RefObject } from 'react'

/**
 * Reads the scrollTop of a DOM element via useSyncExternalStore so that
 * consumers only re-render when the value crosses the threshold they care about.
 * No setState on every scroll tick — the subscription is external to React.
 */
export function useScrollTop(ref: RefObject<HTMLElement | null>): number {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      const el = ref.current
      if (!el) return () => {}
      el.addEventListener('scroll', cb, { passive: true })
      return () => el.removeEventListener('scroll', cb)
    },
    [ref]
  )

  const getSnapshot = useCallback(
    () => ref.current?.scrollTop ?? 0,
    [ref]
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => 0)
}
