import type { AgentProfile, AgentPattern } from '@shared/agent-types'
import type { ChannelAgentConfig } from '@shared/knowledge-types'

/** Builds the system prompt from agent profile, patterns, and optional overrides */
export function buildSystemPrompt(
  profile: AgentProfile,
  patterns: readonly AgentPattern[],
  options?: {
    knowledgeContext?: string
    channelConfig?: ChannelAgentConfig | null
    recentMessages?: readonly string[]
  }
): string {
  const parts: string[] = []
  const channelConfig = options?.channelConfig

  // Agent identity — always present regardless of overrides
  parts.push(`You are ${profile.name}.`)

  if (profile.role) {
    parts.push(`Your role: ${profile.role}`)
  }

  // Channel-specific system prompt adds to (not replaces) the identity
  if (channelConfig?.systemPromptOverride) {
    parts.push(`\nChannel-specific instructions:\n${channelConfig.systemPromptOverride}`)
  }

  // Tone: channel personality override takes precedence
  if (channelConfig?.personalityOverride) {
    parts.push(`Communication style: ${channelConfig.personalityOverride}`)
  } else if (profile.tone) {
    parts.push(`Communication style: ${profile.tone}`)
  }

  if (profile.language && profile.language !== 'en') {
    parts.push(`Primary language: ${profile.language}`)
  }

  if (profile.knowledge) {
    parts.push(`\nGeneral knowledge:\n${profile.knowledge}`)
  }

  if (profile.boundaries) {
    parts.push(`\nBoundaries and constraints:\n${profile.boundaries}`)
  }

  // Inject knowledge base context if available
  if (options?.knowledgeContext) {
    parts.push(options.knowledgeContext)
    parts.push(buildKnowledgeInstructions(true))
  } else {
    parts.push(buildKnowledgeInstructions(false))
  }

  // Inject recent conversation context for follow-up awareness
  if (options?.recentMessages && options.recentMessages.length > 0) {
    parts.push('\nRecent conversation in this channel:')
    for (const msg of options.recentMessages) {
      parts.push(`> ${msg}`)
    }
    parts.push('Use this context to understand follow-up questions and maintain conversation continuity.')
  }

  const enabledPatterns = patterns.filter((p) => p.enabled)
  if (enabledPatterns.length > 0) {
    parts.push('\nResponse patterns (use when matching):')
    for (const p of enabledPatterns) {
      parts.push(`- When ${p.triggerType} matches "${p.triggerValue}": ${p.responseTemplate}`)
    }
  }

  parts.push('\nKeep responses concise, helpful, and natural.')

  return parts.join('\n')
}

/**
 * Build instructions that tell the agent HOW to use knowledge.
 * Different instructions depending on whether knowledge was found.
 */
function buildKnowledgeInstructions(hasKnowledge: boolean): string {
  if (hasKnowledge) {
    return [
      '',
      'How to use the reference material above:',
      '- Synthesize information naturally into your answer. Do not just copy-paste.',
      '- If multiple entries are relevant, combine them into a coherent response.',
      '- You may reference where the info comes from briefly (e.g., "Based on our FAQ..." or "Per our server rules...") but do not mechanically cite entry numbers.',
      '- If the question is partially covered, share what you know and clearly state what you are unsure about.',
      '- If the question is completely outside the reference material, say you do not have specific information about that and suggest who or where to ask.'
    ].join('\n')
  }

  return [
    '',
    'You have a knowledge base but no entries matched this question.',
    'Answer based on your general knowledge and role. If the question seems specific to this community and you lack the information, say so honestly rather than guessing.'
  ].join('\n')
}
