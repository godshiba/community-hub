import { contextBridge, ipcRenderer } from 'electron'
import type { IpcContract, IpcResult } from '@shared/ipc-types'

const api = {
  invoke: <K extends keyof IpcContract>(
    channel: K,
    ...args: IpcContract[K]['request'] extends void ? [] : [IpcContract[K]['request']]
  ): Promise<IpcResult<IpcContract[K]['response']>> => {
    return ipcRenderer.invoke(channel, ...args)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
