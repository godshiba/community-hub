import { ipcMain } from 'electron'
import type { IpcContract, IpcResult } from '@shared/ipc-types'

export function registerHandler<K extends keyof IpcContract>(
  channel: K,
  handler: (payload: IpcContract[K]['request']) => Promise<IpcContract[K]['response']> | IpcContract[K]['response']
): void {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, async (_event, payload): Promise<IpcResult<IpcContract[K]['response']>> => {
    try {
      const data = await handler(payload)
      return { success: true, data }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[IPC] ${channel} error:`, message)
      return { success: false, error: message }
    }
  })
}
