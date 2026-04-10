import type { AiProvider } from './provider.interface'
import type { ContentClassification } from '@shared/content-moderation-types'
import { buildClassificationPrompt, parseClassificationResponse } from './classification-prompts'

// ---------------------------------------------------------------------------
// LRU cache for recent classifications
// ---------------------------------------------------------------------------

interface CacheEntry {
  readonly classification: ContentClassification
  readonly timestamp: number
}

const CACHE_MAX = 200
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

function cacheKey(content: string): string {
  return content.trim().toLowerCase().slice(0, 500)
}

function getCached(content: string): ContentClassification | null {
  const key = cacheKey(content)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.classification
}

function setCache(content: string, classification: ContentClassification): void {
  const key = cacheKey(content)
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { classification, timestamp: Date.now() })
}

// ---------------------------------------------------------------------------
// Heuristic pre-filter
// ---------------------------------------------------------------------------

const SUSPICIOUS_PATTERNS = [
  /https?:\/\/\S+/i,
  /free\s+(nitro|gift|money|crypto|nft)/i,
  /click\s+(here|this|now)/i,
  /\b(f+u+c+k|s+h+i+t|n+i+g+g+|k+i+l+l\s+your)/i,
  /\b(kys|stfu|gtfo)\b/i,
  /@everyone|@here/i,
  /discord\.gg\//i,
  /t\.me\//i,
  /(.)\1{5,}/,
  /[A-Z\s]{20,}/
]

export function isSuspicious(content: string): boolean {
  return SUSPICIOUS_PATTERNS.some((p) => p.test(content))
}

// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------

const CLEAN_CLASSIFICATION: ContentClassification = {
  primaryCategory: 'clean',
  scores: [
    { category: 'clean', score: 1.0 },
    { category: 'toxic', score: 0.0 },
    { category: 'nsfw_text', score: 0.0 },
    { category: 'spam', score: 0.0 },
    { category: 'scam', score: 0.0 },
    { category: 'harassment', score: 0.0 },
    { category: 'hate_speech', score: 0.0 },
    { category: 'self_harm', score: 0.0 }
  ],
  confidence: 1.0,
  reasoning: 'Content passed heuristic pre-filter as clean'
}

export async function classifyContent(
  provider: AiProvider,
  content: string,
  channelContext?: string
): Promise<ContentClassification> {
  if (content.trim().length === 0) return CLEAN_CLASSIFICATION

  const cached = getCached(content)
  if (cached) return cached

  const systemPrompt = buildClassificationPrompt(channelContext)
  const response = await provider.complete(systemPrompt, content)
  const parsed = parseClassificationResponse(response)

  if (!parsed) return CLEAN_CLASSIFICATION

  const classification: ContentClassification = {
    primaryCategory: parsed.primaryCategory,
    scores: parsed.scores,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning
  }

  setCache(content, classification)
  return classification
}
