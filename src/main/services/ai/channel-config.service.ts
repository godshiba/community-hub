import type { ChannelAgentConfig } from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'
import * as knowledgeRepo from './knowledge.repository'

/** In-memory cache of channel configs for fast lookup during message processing */
let configCache: Map<string, ChannelAgentConfig> = new Map()
let cacheLoaded = false

function cacheKey(platform: string, channelId: string): string {
  return `${platform}:${channelId}`
}

/** Load all channel configs into memory cache */
export function refreshChannelConfigs(): void {
  configCache = new Map()
  const configs = knowledgeRepo.getChannelConfigs()
  for (const config of configs) {
    configCache.set(cacheKey(config.platform, config.channelId), config)
  }
  cacheLoaded = true
}

/** Get channel-specific agent config, or null for default behavior */
export function getChannelConfig(
  platform: Platform,
  channelId: string
): ChannelAgentConfig | null {
  if (!cacheLoaded) {
    refreshChannelConfigs()
  }
  return configCache.get(cacheKey(platform, channelId)) ?? null
}

/** Get the effective respond mode for a channel */
export function getEffectiveRespondMode(
  platform: Platform,
  channelId: string,
  defaultMode: 'always' | 'mentioned' | 'never'
): 'always' | 'mentioned' | 'never' {
  const config = getChannelConfig(platform, channelId)
  if (config?.enabled) {
    return config.respondMode
  }
  return defaultMode
}

/** Get knowledge category IDs scoped to a channel (empty = all categories) */
export function getChannelKnowledgeScope(
  platform: Platform,
  channelId: string
): readonly number[] {
  const config = getChannelConfig(platform, channelId)
  if (config?.enabled && config.knowledgeCategoryIds.length > 0) {
    return config.knowledgeCategoryIds
  }
  return []
}

/** Invalidate cache — call after any config update */
export function invalidateChannelConfigCache(): void {
  cacheLoaded = false
  configCache = new Map()
}
