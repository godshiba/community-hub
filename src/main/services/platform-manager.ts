import type { ConnectionResult, Platform, PlatformStatus } from '@shared/settings-types'
import { DiscordService } from './discord.service'
import { TelegramService } from './telegram.service'
import type { PlatformService } from './platform.types'
import { getEnv } from '../env'

let instance: PlatformManager | null = null

export class PlatformManager {
  readonly discord: DiscordService
  readonly telegram: TelegramService
  private readonly services: Record<Platform, PlatformService>

  constructor() {
    this.discord = new DiscordService()
    this.telegram = new TelegramService()
    this.services = {
      discord: this.discord,
      telegram: this.telegram
    }
  }

  getStatus(): PlatformStatus {
    return {
      discord: this.services.discord.status,
      telegram: this.services.telegram.status
    }
  }

  async connect(platform: Platform): Promise<ConnectionResult> {
    const result = await this.services[platform].connect()
    return { platform, ...result }
  }

  disconnect(platform: Platform): void {
    this.services[platform].disconnect()
  }

  async testConnection(platform: Platform): Promise<ConnectionResult> {
    const result = await this.services[platform].testConnection()
    return { platform, ...result }
  }

  disconnectAll(): void {
    this.discord.disconnect()
    this.telegram.disconnect()
  }

  /** Auto-connect platforms that have tokens configured in .env */
  async autoConnect(): Promise<void> {
    const results: string[] = []

    if (getEnv('DISCORD_BOT_TOKEN')) {
      const r = await this.discord.connect()
      if (r.success) {
        results.push(`Discord: connected as ${r.username}`)
        // Register slash commands after successful connection
        await this.discord.registerCommands().catch(() => {
          /* non-fatal — commands may already be registered */
        })
      } else {
        results.push(`Discord: failed — ${r.error}`)
      }
    }

    if (getEnv('TELEGRAM_BOT_TOKEN')) {
      const r = await this.telegram.connect()
      if (r.success) {
        results.push(`Telegram: connected as @${r.username}`)
      } else {
        results.push(`Telegram: failed — ${r.error}`)
      }
    }

    for (const line of results) {
      // eslint-disable-next-line no-console
      console.log(`[Platform] ${line}`)
    }
  }
}

export function initPlatformManager(): PlatformManager {
  instance = new PlatformManager()
  return instance
}

export function getPlatformManager(): PlatformManager {
  if (!instance) throw new Error('PlatformManager not initialized')
  return instance
}
