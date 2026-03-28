import { getDatabase } from './database.service'
import type {
  Platform,
  SaveCredentialPayload,
  CredentialsState,
  Credential,
  AiConfig,
  AppPreferences
} from '@shared/settings-types'

// ── Credentials ──────────────────────────────────────────────

export function saveCredential(payload: SaveCredentialPayload): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO api_credentials (platform, token, secret, user_id, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(platform) DO UPDATE SET
      token = excluded.token,
      secret = excluded.secret,
      user_id = excluded.user_id,
      updated_at = CURRENT_TIMESTAMP
  `).run(payload.platform, payload.token, payload.secret ?? null, payload.userId ?? null)
}

export function loadCredential(platform: Platform): Credential | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM api_credentials WHERE platform = ?').get(platform) as
    | { platform: string; token: string; secret: string | null; user_id: string | null; last_verified: string | null }
    | undefined

  if (!row) return null
  return {
    platform: row.platform as Platform,
    token: row.token,
    secret: row.secret,
    userId: row.user_id,
    lastVerified: row.last_verified
  }
}

export function loadCredentialsState(): CredentialsState {
  const discord = loadCredential('discord')
  const telegram = loadCredential('telegram')
  return {
    discord: { configured: discord !== null, lastVerified: discord?.lastVerified ?? null },
    telegram: { configured: telegram !== null, lastVerified: telegram?.lastVerified ?? null }
  }
}

export function updateLastVerified(platform: Platform): void {
  const db = getDatabase()
  db.prepare('UPDATE api_credentials SET last_verified = CURRENT_TIMESTAMP WHERE platform = ?').run(platform)
}

export function deleteCredential(platform: Platform): void {
  const db = getDatabase()
  db.prepare('DELETE FROM api_credentials WHERE platform = ?').run(platform)
}

// ── AI Config ────────────────────────────────────────────────

export function saveAiConfig(config: AiConfig): void {
  const db = getDatabase()
  const upsert = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)

  const tx = db.transaction(() => {
    upsert.run('ai.provider', config.provider ?? '')
    upsert.run('ai.apiKey', config.apiKey)
    upsert.run('ai.model', config.model)
    upsert.run('ai.temperature', String(config.temperature))
  })
  tx()
}

export function loadAiConfig(): AiConfig {
  const db = getDatabase()
  const rows = db.prepare("SELECT key, value FROM app_settings WHERE key LIKE 'ai.%'").all() as
    Array<{ key: string; value: string }>

  const map = new Map(rows.map((r) => [r.key, r.value]))
  const provider = map.get('ai.provider') || null
  return {
    provider: provider && provider.length > 0 ? (provider as AiConfig['provider']) : null,
    apiKey: map.get('ai.apiKey') ?? '',
    model: map.get('ai.model') ?? '',
    temperature: parseFloat(map.get('ai.temperature') ?? '0.7')
  }
}

// ── App Preferences ──────────────────────────────────────────

const DEFAULT_PREFS: AppPreferences = {
  statsRefreshMinutes: 60,
  memberSyncHours: 6,
  panelLayoutPersist: true
}

export function savePreferences(prefs: AppPreferences): void {
  const db = getDatabase()
  const upsert = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)

  const tx = db.transaction(() => {
    upsert.run('prefs.statsRefreshMinutes', String(prefs.statsRefreshMinutes))
    upsert.run('prefs.memberSyncHours', String(prefs.memberSyncHours))
    upsert.run('prefs.panelLayoutPersist', prefs.panelLayoutPersist ? '1' : '0')
  })
  tx()
}

export function loadPreferences(): AppPreferences {
  const db = getDatabase()
  const rows = db.prepare("SELECT key, value FROM app_settings WHERE key LIKE 'prefs.%'").all() as
    Array<{ key: string; value: string }>

  if (rows.length === 0) return DEFAULT_PREFS

  const map = new Map(rows.map((r) => [r.key, r.value]))
  return {
    statsRefreshMinutes: parseInt(map.get('prefs.statsRefreshMinutes') ?? '60', 10),
    memberSyncHours: parseInt(map.get('prefs.memberSyncHours') ?? '6', 10),
    panelLayoutPersist: map.get('prefs.panelLayoutPersist') !== '0'
  }
}
