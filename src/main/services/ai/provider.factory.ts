import type { AiConfig } from '@shared/settings-types'
import type { AiProvider } from './provider.interface'
import { GrokProvider } from './providers/grok.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { OpenAiProvider } from './providers/openai.provider'
import { GeminiProvider } from './providers/gemini.provider'

/** Creates the appropriate provider from user config, or null if unconfigured */
export function createProvider(config: AiConfig): AiProvider | null {
  if (!config.provider || !config.apiKey) return null

  switch (config.provider) {
    case 'grok':
      return new GrokProvider(config.apiKey, config.model || 'grok-3-mini')
    case 'claude':
      return new ClaudeProvider(config.apiKey, config.model || 'claude-sonnet-4-5-20250514')
    case 'openai':
      return new OpenAiProvider(config.apiKey, config.model || 'gpt-4.1-mini')
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model || 'gemini-2.5-flash')
    default:
      return null
  }
}
