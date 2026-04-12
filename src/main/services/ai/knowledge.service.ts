import type { KnowledgeEntry, KnowledgeSearchResult } from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'
import * as knowledgeRepo from './knowledge.repository'

/** Maximum number of knowledge entries to include in agent context */
const MAX_CONTEXT_ENTRIES = 5

/** Minimum FTS5 rank threshold to consider relevant */
const MIN_RELEVANCE_RANK = 0.01

export interface KnowledgeContext {
  entries: readonly KnowledgeEntry[]
  usedEntryIds: readonly number[]
}

/**
 * Retrieve relevant knowledge entries for a user question.
 * Uses FTS5 full-text search with optional category scoping.
 */
export function retrieveKnowledge(
  question: string,
  platform: Platform,
  categoryIds?: readonly number[]
): KnowledgeContext {
  if (!question.trim()) {
    return { entries: [], usedEntryIds: [] }
  }

  // Search with platform scope
  let results = knowledgeRepo.searchEntries({
    query: question,
    platformScope: platform,
    limit: MAX_CONTEXT_ENTRIES * 2
  })

  // Filter by category scope if channel has specific categories
  if (categoryIds && categoryIds.length > 0) {
    results = results.filter(
      (r) => r.entry.categoryId === null || categoryIds.includes(r.entry.categoryId)
    )
  }

  // Filter by minimum relevance
  const relevant = results.filter((r) => r.rank >= MIN_RELEVANCE_RANK)

  // Take top N
  const topResults = relevant.slice(0, MAX_CONTEXT_ENTRIES)

  // Track usage
  const usedIds = topResults.map((r) => r.entry.id)
  for (const id of usedIds) {
    knowledgeRepo.incrementEntryUsage(id)
  }

  return {
    entries: topResults.map((r) => r.entry),
    usedEntryIds: usedIds
  }
}

/**
 * Build knowledge context string for injection into the system prompt.
 */
export function buildKnowledgeContextBlock(
  entries: readonly KnowledgeEntry[]
): string {
  if (entries.length === 0) return ''

  const parts: string[] = ['\n--- Knowledge Base References ---']

  for (const entry of entries) {
    const categoryLabel = entry.categoryName ? ` [${entry.categoryName}]` : ''
    const tagLabel =
      entry.tags.length > 0 ? ` (tags: ${entry.tags.join(', ')})` : ''
    parts.push(`\n### ${entry.title}${categoryLabel}${tagLabel}`)
    parts.push(entry.content)
  }

  parts.push('\n--- End Knowledge Base ---')
  parts.push(
    'Use the knowledge base entries above to inform your answers. Cite the entry title when referencing specific information. If the question is not covered by the knowledge base, say so honestly.'
  )

  return parts.join('\n')
}

/**
 * Calculate a confidence boost based on how well the knowledge base covers the question.
 * Returns a value between 0 and 0.2 to add to the base confidence.
 */
export function knowledgeConfidenceBoost(
  results: readonly KnowledgeSearchResult[]
): number {
  if (results.length === 0) return 0

  // Strong match: highest rank entry is very relevant
  const topRank = results[0].rank
  if (topRank > 5) return 0.2
  if (topRank > 2) return 0.15
  if (topRank > 0.5) return 0.1
  return 0.05
}
