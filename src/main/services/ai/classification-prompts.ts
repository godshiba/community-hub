import type { ContentCategory } from '@shared/content-moderation-types'

const CATEGORIES_DESCRIPTION = `
Categories (mutually exclusive primary, but scores for all):
- clean: Normal, appropriate content
- toxic: Rude, disrespectful, or provocative language
- nsfw_text: Sexually explicit or suggestive text
- spam: Repetitive, promotional, or unsolicited content
- scam: Phishing, fake giveaways, impersonation, or fraud attempts
- harassment: Targeted attacks, bullying, or intimidation of a specific person
- hate_speech: Discrimination or attacks based on race, gender, religion, etc.
- self_harm: Content promoting or describing self-injury or suicide
`.trim()

export function buildClassificationPrompt(channelContext?: string): string {
  const context = channelContext
    ? `\nChannel context: ${channelContext}`
    : ''

  return `You are a content moderation classifier. Analyze the message and classify it.${context}

${CATEGORIES_DESCRIPTION}

Respond ONLY with valid JSON in this exact format, no other text:
{
  "primaryCategory": "<category>",
  "scores": [
    {"category": "clean", "score": 0.0},
    {"category": "toxic", "score": 0.0},
    {"category": "nsfw_text", "score": 0.0},
    {"category": "spam", "score": 0.0},
    {"category": "scam", "score": 0.0},
    {"category": "harassment", "score": 0.0},
    {"category": "hate_speech", "score": 0.0},
    {"category": "self_harm", "score": 0.0}
  ],
  "confidence": 0.0,
  "reasoning": "<brief explanation>"
}

Rules:
- Scores are 0.0 to 1.0 per category
- primaryCategory is the highest-scored non-clean category, or "clean" if all others are below 0.3
- confidence is your overall certainty (0.0 to 1.0)
- Be conservative: only flag content that clearly violates; ambiguous content should lean toward "clean"
- Consider context: gaming/internet slang is not necessarily toxic`
}

const VALID_CATEGORIES = new Set<string>([
  'clean', 'toxic', 'nsfw_text', 'spam', 'scam',
  'harassment', 'hate_speech', 'self_harm'
])

export function parseClassificationResponse(raw: string): {
  primaryCategory: ContentCategory
  scores: ReadonlyArray<{ category: ContentCategory; score: number }>
  confidence: number
  reasoning: string
} | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (!VALID_CATEGORIES.has(parsed.primaryCategory)) return null
    if (!Array.isArray(parsed.scores)) return null
    if (typeof parsed.confidence !== 'number') return null

    const scores = parsed.scores
      .filter((s: { category: string; score: number }) =>
        VALID_CATEGORIES.has(s.category) && typeof s.score === 'number'
      )
      .map((s: { category: string; score: number }) => ({
        category: s.category as ContentCategory,
        score: Math.max(0, Math.min(1, s.score))
      }))

    return {
      primaryCategory: parsed.primaryCategory as ContentCategory,
      scores,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reasoning: String(parsed.reasoning ?? '')
    }
  } catch {
    return null
  }
}
