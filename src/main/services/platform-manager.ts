import type { ConnectionResult, Platform, PlatformStatus } from '@shared/settings-types'
import { loadCredential, updateLastVerified } from './credentials.repository'
import { DiscordService } from './discord.service'
import { TelegramService } from './telegram.service'
import type { PlatformService } from './platform.types'

let instance: PlatformManager | null = null

export class PlatformManager {
  private readonly services: Record<Platform, PlatformService>

  constructor() {
    this.services = {
      discord: new DiscordService(),
      telegram: new TelegramService()
    }
  }

  getStatus(): PlatformStatus {
    return {
      discord: this.services.discord.status,
      telegram: this.services.telegram.status
    }
  }

  async connect(platform: Platform): Promise<ConnectionResult> {
    const credential = loadCredential(platform)
    if (!credential) {
      return { platform, success: false, error: 'No credentials configured' }
    }

    const result = await this.services[platform].connect(credential.token)

    if (result.success) {
      updateLastVerified(platform)
    }

    return { platform, ...result }
  }

  disconnect(platform: Platform): void {
    this.services[platform].disconnect()
  }

  async testConnection(platform: Platform): Promise<ConnectionResult> {
    const credential = loadCredential(platform)
    if (!credential) {
      return { platform, success: false, error: 'No credentials configured' }
    }

    const result = await this.services[platform].testConnection(credential.token)

    if (result.success) {
      updateLastVerified(platform)
    }

    return { platform, ...result }
  }

  disconnectAll(): void {
    this.services.discord.disconnect()
    this.services.telegram.disconnect()
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
