import TelegramBot from 'node-telegram-bot-api'
import type { ConnectionStatus } from '@shared/settings-types'
import type { PlatformService, PlatformStats } from './platform.types'

export class TelegramService implements PlatformService {
  readonly platform = 'telegram' as const
  private bot: TelegramBot | null = null
  private _status: ConnectionStatus = 'disconnected'
  private _username = ''

  get status(): ConnectionStatus {
    return this._status
  }

  async connect(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
    this.disconnect()
    this._status = 'connecting'

    try {
      this.bot = new TelegramBot(token, { polling: true })
      const me = await this.bot.getMe()
      this._username = me.username ?? me.first_name
      this._status = 'connected'

      this.bot.on('polling_error', () => {
        this._status = 'error'
      })

      return { success: true, username: this._username }
    } catch (err: unknown) {
      this._status = 'error'
      this.bot?.stopPolling()
      this.bot = null
      return { success: false, error: err instanceof Error ? err.message : 'Failed to connect' }
    }
  }

  disconnect(): void {
    if (this.bot) {
      this.bot.stopPolling()
      this.bot = null
    }
    this._status = 'disconnected'
    this._username = ''
  }

  async testConnection(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
    const testBot = new TelegramBot(token, { polling: false })

    try {
      const me = await testBot.getMe()
      return { success: true, username: me.username ?? me.first_name }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async getStats(): Promise<PlatformStats> {
    if (!this.bot || this._status !== 'connected') {
      return { memberCount: 0, onlineCount: 0, messageCountToday: 0 }
    }

    // Telegram bot API doesn't provide aggregate stats without chat IDs
    // Real stats will be built in Phase 3 with tracked chats
    return { memberCount: 0, onlineCount: 0, messageCountToday: 0 }
  }
}
