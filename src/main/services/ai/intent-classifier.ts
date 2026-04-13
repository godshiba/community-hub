import type { AiProvider } from './provider.interface'
import type { IntentClassification, IntentType, ConversationTurn } from '@shared/agent-brain-types'

/** Greeting words for fast-path classification (no LLM needed) */
const GREETING_WORDS = new Set([
  'hi', 'hello', 'hey', 'sup', 'yo', 'hola', 'howdy', 'greetings',
  'good morning', 'good evening', 'good afternoon', 'gm', 'morning'
])

/** Follow-up patterns (no LLM needed) */
const FOLLOW_UP_PATTERNS = [
  /^(yes|yeah|yep|yup|ok|okay|sure|right|exactly|correct|no|nope|nah)[\s.!?]*$/i,
  /^(thanks|thank you|thx|ty|cheers)[\s.!?]*$/i,
  /^what about/i,
  /^and (what|how|why|where|when)/i,
  /^but (what|how|why|where|when)/i,
  /^also[,\s]/i,
  /^can you also/i
]

/**
 * Classify user intent — uses fast-path for obvious patterns,
 * falls back to LLM for ambiguous messages.
 */
export async function classifyIntent(
  provider: AiProvider,
  message: string,
  recentTurns: readonly ConversationTurn[]
): Promise<IntentClassification> {
  // Fast path: greetings (< 5 words, contains greeting word)
  const words = message.trim().split(/\s+/)
  if (words.length <= 5) {
    const lower = message.toLowerCase().replace(/[^a-z\s]/g, '').trim()
    if (GREETING_WORDS.has(lower) || [...GREETING_WORDS].some((g) => lower.startsWith(g))) {
      return {
        intent: 'greeting',
        confidence: 0.95,
        needsKnowledge: false,
        needsUserHistory: true,
        isUrgent: false
      }
    }
  }

  // Fast path: follow-ups
  if (recentTurns.length > 0 && FOLLOW_UP_PATTERNS.some((p) => p.test(message.trim()))) {
    return {
      intent: 'follow_up',
      confidence: 0.9,
      needsKnowledge: true,
      needsUserHistory: true,
      isUrgent: false
    }
  }

  // Fast path: messages ending with ? are likely questions
  const trimmed = message.trim()
  if (trimmed.endsWith('?') && words.length <= 4) {
    return {
      intent: 'question',
      confidence: 0.8,
      needsKnowledge: true,
      needsUserHistory: false,
      isUrgent: false
    }
  }

  // LLM classification for everything else
  return classifyWithLlm(provider, message, recentTurns)
}

async function classifyWithLlm(
  provider: AiProvider,
  message: string,
  recentTurns: readonly ConversationTurn[]
): Promise<IntentClassification> {
  const contextLines: string[] = []
  if (recentTurns.length > 0) {
    const recent = recentTurns.slice(-2)
    for (const turn of recent) {
      contextLines.push(`User: ${turn.userMessage}`)
      contextLines.push(`Agent: ${turn.agentResponse}`)
    }
  }

  const recentContext = contextLines.length > 0
    ? `Recent context:\n${contextLines.join('\n')}\n`
    : ''

  const systemPrompt = `You classify community messages. Return ONLY valid JSON, no markdown.
${recentContext}Message: "${message}"
Respond: { "intent": "question"|"request"|"complaint"|"greeting"|"follow_up"|"off_topic"|"feedback", "confidence": 0.0-1.0, "needsKnowledge": bool, "needsUserHistory": bool, "isUrgent": bool }`

  try {
    const raw = await provider.complete(systemPrompt, 'Classify the message above.')
    return parseClassification(raw)
  } catch {
    return fallbackClassification(message)
  }
}

function parseClassification(raw: string): IntentClassification {
  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return fallbackClassification('')

  try {
    const parsed = JSON.parse(jsonMatch[0])
    const validIntents: IntentType[] = [
      'question', 'request', 'complaint', 'greeting',
      'follow_up', 'off_topic', 'feedback'
    ]

    const intent = validIntents.includes(parsed.intent) ? parsed.intent : 'question'
    return {
      intent,
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
      needsKnowledge: parsed.needsKnowledge === true,
      needsUserHistory: parsed.needsUserHistory === true,
      isUrgent: parsed.isUrgent === true
    }
  } catch {
    return fallbackClassification('')
  }
}

function fallbackClassification(_message: string): IntentClassification {
  return {
    intent: 'question',
    confidence: 0.5,
    needsKnowledge: true,
    needsUserHistory: false,
    isUrgent: false
  }
}
