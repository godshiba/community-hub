import type { KnowledgeEntry } from '@shared/knowledge-types'
import type { Platform } from '@shared/settings-types'
import * as knowledgeRepo from './knowledge.repository'

/** Maximum number of knowledge entries to include in agent context */
const MAX_CONTEXT_ENTRIES = 5

/** Minimum FTS5 rank to consider relevant (absolute BM25 score) */
const MIN_RELEVANCE_RANK = 0.01

/** Common words to strip before FTS5 search — they add noise, not signal */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'about',
  'up', 'out', 'if', 'or', 'and', 'but', 'not', 'no', 'so', 'than',
  'too', 'very', 'just', 'that', 'this', 'it', 'its', 'my', 'your',
  'his', 'her', 'our', 'their', 'what', 'which', 'who', 'when', 'where',
  'how', 'why', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'some', 'any', 'i', 'me', 'we', 'you', 'he', 'she', 'they', 'them',
  'hey', 'hi', 'hello', 'thanks', 'thank', 'please', 'lol', 'ok',
  'yeah', 'yes', 'no', 'nope', 'yep', 'sure', 'right', 'well'
])

/** Recent conversation buffer per channel — for follow-up context */
const conversationBuffer: Map<string, readonly string[]> = new Map()
const MAX_BUFFER_SIZE = 5

export interface KnowledgeContext {
  entries: readonly KnowledgeEntry[]
  usedEntryIds: readonly number[]
  topRank: number
}

/**
 * Extract meaningful keywords from a user message.
 * Strips stop words, punctuation, and very short terms.
 */
function extractKeywords(message: string): string {
  const words = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))

  // Deduplicate while preserving order
  const seen = new Set<string>()
  const unique: string[] = []
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w)
      unique.push(w)
    }
  }

  return unique.join(' ')
}

/**
 * Track conversation for follow-up context.
 */
function bufferKey(platform: string, channelId: string): string {
  return `${platform}:${channelId}`
}

export function recordMessage(
  platform: Platform,
  channelId: string,
  message: string
): void {
  const key = bufferKey(platform, channelId)
  const existing = conversationBuffer.get(key) ?? []
  const updated = [...existing, message].slice(-MAX_BUFFER_SIZE)
  conversationBuffer.set(key, updated)
}

export function getRecentContext(
  platform: Platform,
  channelId: string
): readonly string[] {
  return conversationBuffer.get(bufferKey(platform, channelId)) ?? []
}

/**
 * Retrieve relevant knowledge entries for a user question.
 * Uses keyword extraction + FTS5 search with optional category scoping.
 * Falls back to broader search if keyword extraction yields nothing.
 */
export function retrieveKnowledge(
  question: string,
  platform: Platform,
  channelId: string,
  categoryIds?: readonly number[]
): KnowledgeContext {
  if (!question.trim()) {
    return { entries: [], usedEntryIds: [], topRank: 0 }
  }

  // Record this message for follow-up context
  recordMessage(platform, channelId, question)

  // Extract keywords for a focused search
  const keywords = extractKeywords(question)

  // If the message is too trivial (no keywords after stripping), check
  // if recent conversation provides context for a follow-up
  let searchTerms = keywords
  if (!searchTerms) {
    const recent = getRecentContext(platform, channelId)
    if (recent.length > 1) {
      // Use keywords from last few messages to handle follow-ups like "what about that?"
      const combined = recent.slice(-3).join(' ')
      searchTerms = extractKeywords(combined)
    }
    if (!searchTerms) {
      return { entries: [], usedEntryIds: [], topRank: 0 }
    }
  }

  let results = knowledgeRepo.searchEntries({
    query: searchTerms,
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
    usedEntryIds: usedIds,
    topRank: topResults.length > 0 ? topResults[0].rank : 0
  }
}

/**
 * Build knowledge context string for injection into the system prompt.
 * Designed to give the LLM structured reference material it can synthesize from.
 */
export function buildKnowledgeContextBlock(
  entries: readonly KnowledgeEntry[]
): string {
  if (entries.length === 0) return ''

  const parts: string[] = ['\n--- Reference Material ---']

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const categoryLabel = entry.categoryName ? ` [${entry.categoryName}]` : ''
    const tagLabel =
      entry.tags.length > 0 ? ` (${entry.tags.join(', ')})` : ''
    parts.push(`\n[${i + 1}] ${entry.title}${categoryLabel}${tagLabel}`)
    parts.push(entry.content)
  }

  parts.push('\n--- End Reference Material ---')

  return parts.join('\n')
}

/**
 * Calculate a graduated confidence boost based on search result quality.
 * Higher rank = better FTS5 BM25 match = more confident the answer is grounded.
 */
export function calculateKnowledgeConfidenceBoost(
  resultCount: number,
  topRank: number
): number {
  if (resultCount === 0) return 0

  // Multiple strong matches = high confidence
  if (resultCount >= 3 && topRank > 2) return 0.25
  if (resultCount >= 2 && topRank > 1) return 0.2
  if (topRank > 2) return 0.15
  if (topRank > 0.5) return 0.1
  return 0.05
}
