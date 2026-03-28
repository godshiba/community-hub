import { registerHandler } from './register-handler'
import {
  saveCredential,
  loadCredentialsState,
  saveAiConfig,
  loadAiConfig,
  savePreferences,
  loadPreferences
} from '../services/credentials.repository'
import { getPlatformManager } from '../services/platform-manager'
import { getEnv } from '../env'

export function registerSettingsHandlers(): void {
  registerHandler('settings:saveCredentials', (payload) => {
    saveCredential(payload)
  })

  registerHandler('settings:loadCredentials', () => {
    // For env-backed tokens, report configured if env var is set
    const state = loadCredentialsState()
    return {
      discord: {
        configured: state.discord.configured || !!getEnv('DISCORD_BOT_TOKEN'),
        lastVerified: state.discord.lastVerified
      },
      telegram: {
        configured: state.telegram.configured || !!getEnv('TELEGRAM_BOT_TOKEN'),
        lastVerified: state.telegram.lastVerified
      }
    }
  })

  registerHandler('settings:testConnection', async (payload) => {
    const manager = getPlatformManager()
    return manager.testConnection(payload.platform)
  })

  registerHandler('settings:saveAiConfig', (payload) => {
    saveAiConfig(payload)
  })

  registerHandler('settings:loadAiConfig', () => {
    return loadAiConfig()
  })

  registerHandler('settings:savePreferences', (payload) => {
    savePreferences(payload)
  })

  registerHandler('settings:loadPreferences', () => {
    return loadPreferences()
  })

  registerHandler('settings:getPlatformStatus', () => {
    const manager = getPlatformManager()
    return manager.getStatus()
  })

  registerHandler('settings:connectPlatform', async (payload) => {
    const manager = getPlatformManager()
    return manager.connect(payload.platform)
  })

  registerHandler('settings:disconnectPlatform', (payload) => {
    const manager = getPlatformManager()
    manager.disconnect(payload.platform)
  })
}
