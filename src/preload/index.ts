import { contextBridge, ipcRenderer } from 'electron'
import type { IpcContract, IpcResult } from '@shared/ipc-types'
import type { SystemEvent, SystemEventMap } from '@shared/system-types'

const api = {
  invoke: <K extends keyof IpcContract>(
    channel: K,
    ...args: IpcContract[K]['request'] extends void ? [] : [IpcContract[K]['request']]
  ): Promise<IpcResult<IpcContract[K]['response']>> => {
    return ipcRenderer.invoke(channel, ...args)
  },
  /**
   * Subscribe to a system event pushed from the main process.
   * Returns an unsubscribe function — call it in React effect cleanup.
   */
  on: <E extends SystemEvent>(
    event: E,
    callback: (payload: SystemEventMap[E]) => void
  ): (() => void) => {
    const listener = (_e: unknown, payload: SystemEventMap[E]): void => callback(payload)
    ipcRenderer.on(event, listener)
    return () => ipcRenderer.removeListener(event, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
