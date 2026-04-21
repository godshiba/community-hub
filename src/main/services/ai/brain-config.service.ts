import { getDatabase } from '../database.service'
import type { BrainConfig } from '@shared/agent-brain-types'
import { DEFAULT_BRAIN_CONFIG } from '@shared/agent-brain-types'

// ---------------------------------------------------------------------------
// Brain Config Service
// ---------------------------------------------------------------------------
// Stores a single JSON row in the `brain_config` table (id = 1).
// On read, parses JSON and merges with defaults so newly added keys are
// always present. On write, merges partial update with existing config.
// ---------------------------------------------------------------------------

export function getBrainConfig(): BrainConfig {
  const db = getDatabase()
  const row = db
    .prepare('SELECT config_json FROM brain_config WHERE id = 1')
    .get() as { config_json: string } | undefined

  if (!row) {
    return { ...DEFAULT_BRAIN_CONFIG }
  }

  const stored = safeParseConfig(row.config_json)
  return mergeWithDefaults(stored)
}

export function updateBrainConfig(partial: Partial<BrainConfig>): BrainConfig {
  const existing = getBrainConfig()
  const merged: BrainConfig = {
    ...existing,
    ...partial,
    // Deep-merge enabledActions so partial updates don't wipe the whole map
    enabledActions: {
      ...existing.enabledActions,
      ...(partial.enabledActions ?? {})
    }
  }

  const db = getDatabase()
  db.prepare(`
    UPDATE brain_config
    SET config_json = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(JSON.stringify(merged))

  return merged
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseConfig(json: string): Partial<BrainConfig> {
  try {
    const parsed: unknown = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Partial<BrainConfig>)
      : {}
  } catch {
    return {}
  }
}

function mergeWithDefaults(stored: Partial<BrainConfig>): BrainConfig {
  return {
    ...DEFAULT_BRAIN_CONFIG,
    ...stored,
    enabledActions: {
      ...DEFAULT_BRAIN_CONFIG.enabledActions,
      ...(stored.enabledActions ?? {})
    }
  }
}
