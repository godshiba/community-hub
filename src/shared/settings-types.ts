/** Platform identifiers for credential storage */
export type Platform = 'discord' | 'telegram'

/** AI provider identifiers */
export type AiProvider = 'grok' | 'claude' | 'openai' | 'gemini'

/** Connection status for a single platform */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/** Stored credential record (token is masked when sent to renderer) */
export interface Credential {
  platform: Platform
  token: string
  secret: string | null
  userId: string | null
  lastVerified: string | null
}

/** What the renderer sends to save a credential */
export interface SaveCredentialPayload {
  platform: Platform
  token: string
  secret?: string
  userId?: string
}

/** Credentials as loaded for the renderer (tokens masked) */
export interface CredentialsState {
  discord: { configured: boolean; lastVerified: string | null }
  telegram: { configured: boolean; lastVerified: string | null }
}

/** Test connection request */
export interface TestConnectionPayload {
  platform: Platform
}

/** Test connection result */
export interface ConnectionResult {
  platform: Platform
  success: boolean
  username?: string
  error?: string
}

/** AI provider configuration */
export interface AiConfig {
  provider: AiProvider | null
  apiKey: string
  model: string
  temperature: number
}

/** App preferences stored in app_settings table */
export interface AppPreferences {
  statsRefreshMinutes: number
  memberSyncHours: number
  panelLayoutPersist: boolean
}

/** Platform connection state broadcast to renderer */
export interface PlatformStatus {
  discord: ConnectionStatus
  telegram: ConnectionStatus
}
