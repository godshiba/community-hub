import { useEffect } from 'react'

/**
 * Bridges the macOS system accent color into CSS.
 *
 * On mount, fetches the current accent via `system:getAccentColor` and
 * writes it to `--accent-system` on `<html>`. Subscribes to
 * `system:accentChanged` so System Settings changes reflect live.
 *
 * When the main process returns `null` (Graphite / multicolor), sets
 * `[data-accent="graphite"]` on `<html>` so CSS can swap to the neutral
 * fallback defined in globals.css.
 *
 * Idempotent — multiple calls are safe; only one effect runs per mount.
 */
export function useSystemAccent(): void {
  useEffect(() => {
    const root = document.documentElement

    const apply = (hex: string | null): void => {
      if (hex === null) {
        root.setAttribute('data-accent', 'graphite')
        root.style.removeProperty('--accent-system')
      } else {
        root.removeAttribute('data-accent')
        root.style.setProperty('--accent-system', hex)
      }
    }

    let cancelled = false
    void window.api.invoke('system:getAccentColor').then((result) => {
      if (cancelled || !result.success) return
      apply(result.data)
    })

    const unsubscribe = window.api.on('system:accentChanged', apply)

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])
}
