import { Client, GatewayIntentBits } from 'discord.js'
import type { ConnectionStatus } from '@shared/settings-types'
import type { PlatformService, PlatformStats } from './platform.types'

export class DiscordService implements PlatformService {
  readonly platform = 'discord' as const
  private client: Client | null = null
  private _status: ConnectionStatus = 'disconnected'
  private _username = ''

  get status(): ConnectionStatus {
    return this._status
  }

  async connect(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
    this.disconnect()
    this._status = 'connecting'

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent
        ]
      })

      await this.client.login(token)
      this._username = this.client.user?.username ?? 'Unknown'
      this._status = 'connected'

      this.client.on('error', () => {
        this._status = 'error'
      })

      return { success: true, username: this._username }
    } catch (err: unknown) {
      this._status = 'error'
      this.client?.destroy()
      this.client = null
      return { success: false, error: err instanceof Error ? err.message : 'Failed to connect' }
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.destroy()
      this.client = null
    }
    this._status = 'disconnected'
    this._username = ''
  }

  async testConnection(token: string): Promise<{ success: boolean; username?: string; error?: string }> {
    const testClient = new Client({
      intents: [GatewayIntentBits.Guilds]
    })

    try {
      await testClient.login(token)
      const username = testClient.user?.username ?? 'Unknown'
      testClient.destroy()
      return { success: true, username }
    } catch (err: unknown) {
      testClient.destroy()
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async getStats(): Promise<PlatformStats> {
    if (!this.client || this._status !== 'connected') {
      return { memberCount: 0, onlineCount: 0, messageCountToday: 0 }
    }

    const guilds = this.client.guilds.cache
    let memberCount = 0
    let onlineCount = 0

    for (const guild of guilds.values()) {
      memberCount += guild.memberCount
      onlineCount += guild.approximatePresenceCount ?? 0
    }

    return { memberCount, onlineCount, messageCountToday: 0 }
  }
}
