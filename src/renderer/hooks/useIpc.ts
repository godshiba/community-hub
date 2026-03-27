import { useState, useEffect, useCallback, useRef } from 'react'
import type { IpcContract } from '@shared/ipc-types'

interface UseIpcOptions {
  autoFetch?: boolean
  refreshInterval?: number
}

interface UseIpcReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useIpc<K extends keyof IpcContract>(
  channel: K,
  payload: IpcContract[K]['request'],
  options: UseIpcOptions = {}
): UseIpcReturn<IpcContract[K]['response']> {
  const { autoFetch = true, refreshInterval } = options
  const [data, setData] = useState<IpcContract[K]['response'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const payloadRef = useRef(payload)
  payloadRef.current = payload

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const args = payloadRef.current === undefined
        ? [channel] as const
        : [channel, payloadRef.current] as const
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (window.api.invoke as any)(...args)
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'IPC call failed')
    } finally {
      setLoading(false)
    }
  }, [channel])

  useEffect(() => {
    if (autoFetch) {
      refetch()
    }
  }, [autoFetch, refetch])

  useEffect(() => {
    if (!refreshInterval) return
    const id = setInterval(refetch, refreshInterval)
    return () => clearInterval(id)
  }, [refreshInterval, refetch])

  return { data, loading, error, refetch }
}
