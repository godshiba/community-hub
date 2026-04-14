import { getDatabase } from '../database.service'
import type { Platform } from '@shared/settings-types'
import type {
  UserMemory,
  ConversationTurn,
  IntentType,
  AgentDecidedAction
} from '@shared/agent-brain-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface UserMemoryRow {
  id: number
  platform: string
  platform_user_id: string
  username: string
  first_interaction: string
  last_interaction: string
  interaction_count: number
  primary_language: string | null
  expertise_level: string | null
  facts: string
  conversation_summary: string | null
  updated_at: string
}

interface ConversationTurnRow {
  id: number
  platform: string
  platform_user_id: string
  channel_id: string
  user_message: string
  agent_response: string
  intent: string | null
  knowledge_entry_ids: string
  actions: string
  thought: string | null
  confidence: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function rowToMemory(row: UserMemoryRow): UserMemory {
  return {
    id: row.id,
    platform: row.platform as Platform,
    platformUserId: row.platform_user_id,
    username: row.username,
    firstInteraction: row.first_interaction,
    lastInteraction: row.last_interaction,
    interactionCount: row.interaction_count,
    primaryLanguage: row.primary_language,
    expertiseLevel: row.expertise_level,
    facts: safeParseArray(row.facts),
    conversationSummary: row.conversation_summary,
    updatedAt: row.updated_at
  }
}

function rowToTurn(row: ConversationTurnRow): ConversationTurn {
  return {
    id: row.id,
    platform: row.platform as Platform,
    platformUserId: row.platform_user_id,
    channelId: row.channel_id,
    userMessage: row.user_message,
    agentResponse: row.agent_response,
    intent: row.intent as IntentType | null,
    knowledgeEntryIds: safeParseArray(row.knowledge_entry_ids),
    actions: safeParseArray(row.actions),
    thought: row.thought,
    confidence: row.confidence,
    createdAt: row.created_at
  }
}

function safeParseArray<T>(json: string): readonly T[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// User Memory CRUD
// ---------------------------------------------------------------------------

export function getOrCreate(
  platform: Platform,
  userId: string,
  username: string
): UserMemory {
  const db = getDatabase()
  const existing = db
    .prepare('SELECT * FROM user_memory WHERE platform = ? AND platform_user_id = ?')
    .get(platform, userId) as UserMemoryRow | undefined

  if (existing) {
    // Update username if it changed (users can rename on Discord/Telegram)
    if (existing.username !== username) {
      db.prepare('UPDATE user_memory SET username = ? WHERE id = ?').run(username, existing.id)
      return rowToMemory({ ...existing, username })
    }
    return rowToMemory(existing)
  }

  db.prepare(`
    INSERT INTO user_memory (platform, platform_user_id, username)
    VALUES (?, ?, ?)
  `).run(platform, userId, username)

  // Re-SELECT to get DB-generated timestamps in their canonical format
  const created = db
    .prepare('SELECT * FROM user_memory WHERE platform = ? AND platform_user_id = ?')
    .get(platform, userId) as UserMemoryRow
  return rowToMemory(created)
}

export function getUserMemory(
  platform: string,
  userId: string
): UserMemory | null {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM user_memory WHERE platform = ? AND platform_user_id = ?')
    .get(platform, userId) as UserMemoryRow | undefined
  return row ? rowToMemory(row) : null
}

export function incrementInteraction(
  platform: Platform,
  userId: string
): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE user_memory
    SET interaction_count = interaction_count + 1,
        last_interaction = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE platform = ? AND platform_user_id = ?
  `).run(platform, userId)
}

export function updateFacts(
  platform: Platform,
  userId: string,
  facts: readonly string[]
): void {
  const db = getDatabase()
  // Cap facts at 20 entries
  const capped = facts.slice(0, 20)
  db.prepare(`
    UPDATE user_memory
    SET facts = ?, updated_at = CURRENT_TIMESTAMP
    WHERE platform = ? AND platform_user_id = ?
  `).run(JSON.stringify(capped), platform, userId)
}

export function updateSummary(
  platform: Platform,
  userId: string,
  summary: string
): void {
  const db = getDatabase()
  db.prepare(`
    UPDATE user_memory
    SET conversation_summary = ?, updated_at = CURRENT_TIMESTAMP
    WHERE platform = ? AND platform_user_id = ?
  `).run(summary, platform, userId)
}

export function clearUserMemory(
  platform: string,
  userId: string
): void {
  const db = getDatabase()
  db.prepare('DELETE FROM user_memory WHERE platform = ? AND platform_user_id = ?')
    .run(platform, userId)
  db.prepare('DELETE FROM conversation_turns WHERE platform = ? AND platform_user_id = ?')
    .run(platform, userId)
}

// ---------------------------------------------------------------------------
// Conversation Turns
// ---------------------------------------------------------------------------

export function addConversationTurn(params: {
  platform: Platform
  platformUserId: string
  channelId: string
  userMessage: string
  agentResponse: string
  intent: IntentType | null
  knowledgeEntryIds: readonly number[]
  actions: readonly AgentDecidedAction[]
  thought: string | null
  confidence: number | null
}): ConversationTurn {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO conversation_turns
      (platform, platform_user_id, channel_id, user_message, agent_response,
       intent, knowledge_entry_ids, actions, thought, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.platform,
    params.platformUserId,
    params.channelId,
    params.userMessage,
    params.agentResponse,
    params.intent,
    JSON.stringify(params.knowledgeEntryIds),
    JSON.stringify(params.actions),
    params.thought,
    params.confidence
  )

  return {
    id: result.lastInsertRowid as number,
    platform: params.platform,
    platformUserId: params.platformUserId,
    channelId: params.channelId,
    userMessage: params.userMessage,
    agentResponse: params.agentResponse,
    intent: params.intent,
    knowledgeEntryIds: params.knowledgeEntryIds,
    actions: params.actions,
    thought: params.thought,
    confidence: params.confidence,
    createdAt: new Date().toISOString()
  }
}

export function getConversationHistory(
  platform: Platform,
  userId: string,
  limit = 10
): readonly ConversationTurn[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM conversation_turns
    WHERE platform = ? AND platform_user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(platform, userId, limit) as ConversationTurnRow[]

  // Return in chronological order (oldest first)
  return rows.map(rowToTurn).reverse()
}

export function getRecentConversations(
  limit = 20
): readonly ConversationTurn[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM conversation_turns
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as ConversationTurnRow[]
  return rows.map(rowToTurn)
}


export function getOldestTurns(
  platform: Platform,
  userId: string,
  limit: number
): readonly ConversationTurn[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM conversation_turns
    WHERE platform = ? AND platform_user_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(platform, userId, limit) as ConversationTurnRow[]
  return rows.map(rowToTurn)
}

export function deleteTurns(ids: readonly number[]): void {
  if (ids.length === 0) return
  const db = getDatabase()
  // Chunk to stay within SQLite's bind-parameter limit (999)
  const chunkSize = 900
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const placeholders = chunk.map(() => '?').join(',')
    db.prepare(`DELETE FROM conversation_turns WHERE id IN (${placeholders})`).run(...chunk)
  }
}

export function getUsersWithManyTurns(
  threshold: number,
  limit: number
): readonly { platform: Platform; platformUserId: string }[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT platform, platform_user_id, COUNT(*) as cnt
    FROM conversation_turns
    GROUP BY platform, platform_user_id
    HAVING cnt > ?
    LIMIT ?
  `).all(threshold, limit) as { platform: string; platform_user_id: string }[]
  return rows.map((r) => ({
    platform: r.platform as Platform,
    platformUserId: r.platform_user_id
  }))
}
