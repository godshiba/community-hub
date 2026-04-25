import { useEffect } from 'react'
import { useToolbarStore } from '@/components/shell/toolbarContext'
import type { PanelToolbarConfig } from '@/components/shell/toolbarContext'

/**
 * Registers this panel's toolbar configuration with the Shell.
 * Call at the top of each panel component. Config is cleared when the panel unmounts.
 *
 * Runs after every render so that ReactNode actions stay in sync without
 * needing unstable dependency arrays.
 */
export function usePanelToolbar(config: PanelToolbarConfig): void {
  const store = useToolbarStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    store.setConfig(config)
    return () => { store.setConfig({}) }
  })
}

export type { PanelToolbarConfig }
