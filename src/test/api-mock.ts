import { vi } from 'vitest'
import type { IpcContract } from '@shared/ipc-types'
import type { IpcResult } from '@shared/types'

type InvokeMap = {
  [K in keyof IpcContract]: (
    ...args: IpcContract[K]['request'] extends void ? [] : [IpcContract[K]['request']]
  ) => Promise<IpcResult<IpcContract[K]['response']>>
}

const invokeHandlers: Partial<InvokeMap> = {}

/**
 * Install global window.api mock for store tests.
 * Call in beforeEach to reset handlers.
 */
export function installApiMock(): void {
  const invoke = vi.fn(async (channel: string, ...args: unknown[]) => {
    const handler = invokeHandlers[channel as keyof IpcContract]
    if (handler) {
      return handler(...(args as [never]))
    }
    return { success: true, data: undefined }
  })

  Object.defineProperty(globalThis, 'window', {
    value: {
      api: { invoke }
    },
    writable: true,
    configurable: true
  })
}

/**
 * Register a mock IPC handler that returns success.
 */
export function mockIpcSuccess<K extends keyof IpcContract>(
  channel: K,
  data: IpcContract[K]['response']
): void {
  invokeHandlers[channel] = (async () => ({
    success: true as const,
    data
  })) as never
}

/**
 * Register a mock IPC handler that returns failure.
 */
export function mockIpcError<K extends keyof IpcContract>(
  channel: K,
  error: string
): void {
  invokeHandlers[channel] = (async () => ({
    success: false as const,
    error
  })) as never
}

/**
 * Clear all mock handlers.
 */
export function clearApiMock(): void {
  for (const key of Object.keys(invokeHandlers)) {
    delete invokeHandlers[key as keyof IpcContract]
  }
}
