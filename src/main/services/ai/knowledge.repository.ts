import { getDatabase } from '../database.service'
import type {
  KnowledgeEntry,
  KnowledgeEntryPayload,
  KnowledgeCategory,
  KnowledgeCategoryPayload,
  KnowledgeSearchQuery,
  KnowledgeSearchResult,
  ChannelAgentConfig,
  ChannelAgentConfigPayload
} from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types (snake_case from SQLite)
// ---------------------------------------------------------------------------

interface EntryRow {
  id: number
  title: string
  content: string
  category_id: number | null
  category_name: string | null
  tags: string
  platform_scope: string | null
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

interface CategoryRow {
  id: number
  name: string
  description: string | null
  priority: number
  entry_count: number
  created_at: string
}

interface FtsRow {
  id: number
  title: string
  content: string
  category_id: number | null
  category_name: string | null
  tags: string
  platform_scope: string | null
  usage_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
  rank: number
  snippet: string
}

interface ChannelConfigRow {
  id: number
  platform: string
  channel_id: string
  channel_name: string | null
  respond_mode: string
  system_prompt_override: string | null
  personality_override: string | null
  knowledge_category_ids: string
  enabled: number
  updated_at: string
}

// ---------------------------------------------------------------------------
// Row to domain mappers
// ---------------------------------------------------------------------------

function rowToEntry(row: EntryRow): KnowledgeEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    tags: JSON.parse(row.tags),
    platformScope: row.platform_scope as Platform | null,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToCategory(row: CategoryRow): KnowledgeCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priority: row.priority,
    entryCount: row.entry_count,
    createdAt: row.created_at
  }
}

function rowToChannelConfig(row: ChannelConfigRow): ChannelAgentConfig {
  return {
    id: row.id,
    platform: row.platform as Platform,
    channelId: row.channel_id,
    channelName: row.channel_name,
    respondMode: row.respond_mode as ChannelAgentConfig['respondMode'],
    systemPromptOverride: row.system_prompt_override,
    personalityOverride: row.personality_override,
    knowledgeCategoryIds: JSON.parse(row.knowledge_category_ids),
    enabled: row.enabled === 1,
    updatedAt: row.updated_at
  }
}

// ---------------------------------------------------------------------------
// Knowledge Entry CRUD
// ---------------------------------------------------------------------------

const ENTRY_SELECT = `
  SELECT e.*, c.name as category_name
  FROM knowledge_entries e
  LEFT JOIN knowledge_categories c ON e.category_id = c.id
`

export function getEntries(filter?: {
  categoryId?: number
  platformScope?: string
}): readonly KnowledgeEntry[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: unknown[] = []

  if (filter?.categoryId) {
    conditions.push('e.category_id = ?')
    params.push(filter.categoryId)
  }
  if (filter?.platformScope) {
    conditions.push('(e.platform_scope = ? OR e.platform_scope IS NULL)')
    params.push(filter.platformScope)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(`${ENTRY_SELECT} ${where} ORDER BY e.updated_at DESC`)
    .all(...params) as EntryRow[]
  return rows.map(rowToEntry)
}

export function getEntry(id: number): KnowledgeEntry | null {
  const db = getDatabase()
  const row = db
    .prepare(`${ENTRY_SELECT} WHERE e.id = ?`)
    .get(id) as EntryRow | undefined
  return row ? rowToEntry(row) : null
}

export function createEntry(payload: KnowledgeEntryPayload): KnowledgeEntry {
  const db = getDatabase()
  const tags = JSON.stringify(payload.tags ?? [])
  const info = db.prepare(`
    INSERT INTO knowledge_entries (title, content, category_id, tags, platform_scope)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    payload.title,
    payload.content,
    payload.categoryId ?? null,
    tags,
    payload.platformScope ?? null
  )
  return getEntry(info.lastInsertRowid as number)!
}

export function updateEntry(
  id: number,
  payload: KnowledgeEntryPayload
): KnowledgeEntry {
  const db = getDatabase()
  const tags = JSON.stringify(payload.tags ?? [])
  db.prepare(`
    UPDATE knowledge_entries
    SET title = ?, content = ?, category_id = ?, tags = ?, platform_scope = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    payload.title,
    payload.content,
    payload.categoryId ?? null,
    tags,
    payload.platformScope ?? null,
    id
  )
  return getEntry(id)!
}

export function deleteEntry(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM knowledge_entries WHERE id = ?').run(id)
}

export function incrementEntryUsage(id: number): void {
  const db = getDatabase()
  db.prepare(
    'UPDATE knowledge_entries SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(id)
}

// ---------------------------------------------------------------------------
// FTS5 Full-Text Search
// ---------------------------------------------------------------------------

export function searchEntries(query: KnowledgeSearchQuery): readonly KnowledgeSearchResult[] {
  const db = getDatabase()
  const limit = query.limit ?? 10

  // Build FTS5 match query — escape special chars
  const sanitized = query.query.replace(/['"]/g, '').trim()
  if (sanitized.length === 0) return []

  // Use FTS5 with bm25 ranking, joining back to get category info
  const conditions: string[] = ['knowledge_fts MATCH ?']
  const params: unknown[] = [sanitized]

  if (query.categoryId) {
    conditions.push('e.category_id = ?')
    params.push(query.categoryId)
  }
  if (query.platformScope) {
    conditions.push('(e.platform_scope = ? OR e.platform_scope IS NULL)')
    params.push(query.platformScope)
  }

  const where = conditions.join(' AND ')

  const rows = db.prepare(`
    SELECT e.*, c.name as category_name,
           rank as rank,
           snippet(knowledge_fts, 1, '<mark>', '</mark>', '...', 64) as snippet
    FROM knowledge_fts
    JOIN knowledge_entries e ON knowledge_fts.rowid = e.id
    LEFT JOIN knowledge_categories c ON e.category_id = c.id
    WHERE ${where}
    ORDER BY rank
    LIMIT ?
  `).all(...params, limit) as FtsRow[]

  return rows.map((row) => ({
    entry: rowToEntry(row),
    rank: Math.abs(row.rank),
    snippet: row.snippet
  }))
}

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

export function getCategories(): readonly KnowledgeCategory[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT c.*, COALESCE(cnt.entry_count, 0) as entry_count
    FROM knowledge_categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as entry_count FROM knowledge_entries GROUP BY category_id
    ) cnt ON c.id = cnt.category_id
    ORDER BY c.priority DESC, c.name ASC
  `).all() as CategoryRow[]
  return rows.map(rowToCategory)
}

export function createCategory(payload: KnowledgeCategoryPayload): KnowledgeCategory {
  const db = getDatabase()
  const info = db.prepare(`
    INSERT INTO knowledge_categories (name, description, priority)
    VALUES (?, ?, ?)
  `).run(payload.name, payload.description ?? null, payload.priority ?? 0)

  const row = db.prepare(`
    SELECT c.*, 0 as entry_count FROM knowledge_categories c WHERE c.id = ?
  `).get(info.lastInsertRowid) as CategoryRow
  return rowToCategory(row)
}

export function updateCategory(
  id: number,
  payload: KnowledgeCategoryPayload
): KnowledgeCategory {
  const db = getDatabase()
  db.prepare(`
    UPDATE knowledge_categories SET name = ?, description = ?, priority = ? WHERE id = ?
  `).run(payload.name, payload.description ?? null, payload.priority ?? 0, id)

  const row = db.prepare(`
    SELECT c.*, COALESCE(cnt.entry_count, 0) as entry_count
    FROM knowledge_categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as entry_count FROM knowledge_entries GROUP BY category_id
    ) cnt ON c.id = cnt.category_id
    WHERE c.id = ?
  `).get(id) as CategoryRow
  return rowToCategory(row)
}

export function deleteCategory(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM knowledge_categories WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Channel Agent Config CRUD
// ---------------------------------------------------------------------------

export function getChannelConfigs(): readonly ChannelAgentConfig[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM channel_agent_configs ORDER BY platform, channel_name'
  ).all() as ChannelConfigRow[]
  return rows.map(rowToChannelConfig)
}

export function getChannelConfig(
  platform: string,
  channelId: string
): ChannelAgentConfig | null {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM channel_agent_configs WHERE platform = ? AND channel_id = ?'
  ).get(platform, channelId) as ChannelConfigRow | undefined
  return row ? rowToChannelConfig(row) : null
}

export function upsertChannelConfig(
  payload: ChannelAgentConfigPayload
): ChannelAgentConfig {
  const db = getDatabase()
  const existing = getChannelConfig(payload.platform, payload.channelId)
  const categoryIds = JSON.stringify(payload.knowledgeCategoryIds ?? [])

  if (existing) {
    db.prepare(`
      UPDATE channel_agent_configs
      SET channel_name = ?, respond_mode = ?, system_prompt_override = ?,
          personality_override = ?, knowledge_category_ids = ?, enabled = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      payload.channelName ?? existing.channelName,
      payload.respondMode ?? existing.respondMode,
      payload.systemPromptOverride ?? existing.systemPromptOverride,
      payload.personalityOverride ?? existing.personalityOverride,
      categoryIds,
      payload.enabled !== undefined ? (payload.enabled ? 1 : 0) : (existing.enabled ? 1 : 0),
      existing.id
    )
  } else {
    db.prepare(`
      INSERT INTO channel_agent_configs (platform, channel_id, channel_name, respond_mode, system_prompt_override, personality_override, knowledge_category_ids, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      payload.platform,
      payload.channelId,
      payload.channelName ?? null,
      payload.respondMode ?? 'mentioned',
      payload.systemPromptOverride ?? null,
      payload.personalityOverride ?? null,
      categoryIds,
      payload.enabled !== false ? 1 : 0
    )
  }

  return getChannelConfig(payload.platform, payload.channelId)!
}

export function deleteChannelConfig(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM channel_agent_configs WHERE id = ?').run(id)
}

// ---------------------------------------------------------------------------
// Bulk Import
// ---------------------------------------------------------------------------

export function bulkImportEntries(
  entries: readonly {
    title: string
    content: string
    categoryId?: number | null
    tags?: readonly string[]
  }[]
): { imported: number; failed: number; errors: readonly string[] } {
  const db = getDatabase()
  const errors: string[] = []
  let imported = 0
  let failed = 0

  const insertStmt = db.prepare(`
    INSERT INTO knowledge_entries (title, content, category_id, tags, platform_scope)
    VALUES (?, ?, ?, ?, NULL)
  `)

  const transaction = db.transaction(() => {
    for (const entry of entries) {
      try {
        if (!entry.title.trim() || !entry.content.trim()) {
          errors.push(`Skipped empty entry: "${entry.title || '(no title)'}"`)
          failed++
          continue
        }
        insertStmt.run(
          entry.title.trim(),
          entry.content.trim(),
          entry.categoryId ?? null,
          JSON.stringify(entry.tags ?? [])
        )
        imported++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Failed to import "${entry.title}": ${msg}`)
        failed++
      }
    }
  })

  transaction()
  return { imported, failed, errors }
}
