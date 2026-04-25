import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export interface InspectorConfig {
  enabled: boolean
  renderEmpty?: () => ReactNode
}

export interface PanelToolbarConfig {
  title?: string
  subtitle?: string
  actions?: ReactNode
  inspector?: InspectorConfig
}

export interface ToolbarStore {
  getConfig: () => PanelToolbarConfig
  setConfig: (config: PanelToolbarConfig) => void
  subscribe: (fn: () => void) => () => void
}

export function createToolbarStore(): ToolbarStore {
  let config: PanelToolbarConfig = {}
  const listeners = new Set<() => void>()

  return {
    getConfig: () => config,
    setConfig: (next) => {
      config = next
      listeners.forEach((fn) => fn())
    },
    subscribe: (fn) => {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    }
  }
}

export const ToolbarContext = createContext<ToolbarStore | null>(null)

export function useToolbarStore(): ToolbarStore {
  const ctx = useContext(ToolbarContext)
  if (!ctx) throw new Error('useToolbarStore must be used inside Shell')
  return ctx
}
