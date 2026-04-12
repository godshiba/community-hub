import type { Platform } from './settings-types'

/** Knowledge entry — a single piece of knowledge the agent can reference */
export interface KnowledgeEntry {
  id: number
  title: string
  content: string
  categoryId: number | null
  categoryName: string | null
  tags: readonly string[]
  platformScope: Platform | null
  usageCount: number
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Payload for creating/updating a knowledge entry */
export interface KnowledgeEntryPayload {
  title: string
  content: string
  categoryId?: number | null
  tags?: readonly string[]
  platformScope?: Platform | null
}

/** Knowledge category for organizing entries */
export interface KnowledgeCategory {
  id: number
  name: string
  description: string | null
  priority: number
  entryCount: number
  createdAt: string
}

/** Payload for creating/updating a category */
export interface KnowledgeCategoryPayload {
  name: string
  description?: string | null
  priority?: number
}

/** Search query for knowledge base */
export interface KnowledgeSearchQuery {
  query: string
  categoryId?: number | null
  platformScope?: Platform | null
  limit?: number
}

/** Search result with relevance ranking */
export interface KnowledgeSearchResult {
  entry: KnowledgeEntry
  rank: number
  snippet: string
}

/** Per-channel agent configuration */
export interface ChannelAgentConfig {
  id: number
  platform: Platform
  channelId: string
  channelName: string | null
  respondMode: 'always' | 'mentioned' | 'never'
  systemPromptOverride: string | null
  personalityOverride: string | null
  knowledgeCategoryIds: readonly number[]
  enabled: boolean
  updatedAt: string
}

/** Payload for creating/updating channel config */
export interface ChannelAgentConfigPayload {
  platform: Platform
  channelId: string
  channelName?: string | null
  respondMode?: 'always' | 'mentioned' | 'never'
  systemPromptOverride?: string | null
  personalityOverride?: string | null
  knowledgeCategoryIds?: readonly number[]
  enabled?: boolean
}

/** Bulk import payload */
export interface KnowledgeImportPayload {
  entries: readonly {
    title: string
    content: string
    categoryId?: number | null
    tags?: readonly string[]
  }[]
}

/** Bulk import result */
export interface KnowledgeImportResult {
  imported: number
  failed: number
  errors: readonly string[]
}
