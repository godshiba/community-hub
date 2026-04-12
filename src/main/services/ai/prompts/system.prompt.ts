import type { AgentProfile, AgentPattern } from '@shared/agent-types'
import type { ChannelAgentConfig } from '@shared/knowledge-types'

/** Builds the system prompt from agent profile, patterns, and optional overrides */
export function buildSystemPrompt(
  profile: AgentProfile,
  patterns: readonly AgentPattern[],
  options?: {
    knowledgeContext?: string
    channelConfig?: ChannelAgentConfig | null
  }
): string {
  const parts: string[] = []
  const channelConfig = options?.channelConfig

  // Use channel personality override if available
  if (channelConfig?.systemPromptOverride) {
    parts.push(channelConfig.systemPromptOverride)
  } else {
    parts.push(`You are ${profile.name}.`)

    if (profile.role) {
      parts.push(`Your role: ${profile.role}`)
    }
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
  }

  const enabledPatterns = patterns.filter((p) => p.enabled)
  if (enabledPatterns.length > 0) {
    parts.push('\nResponse patterns (use when matching):')
    for (const p of enabledPatterns) {
      parts.push(`- When ${p.triggerType} matches "${p.triggerValue}": ${p.responseTemplate}`)
    }
  }

  parts.push('\nKeep responses concise and helpful. If unsure, indicate low confidence.')
  parts.push('If a question is not covered by the knowledge base, honestly say you do not have that information.')

  return parts.join('\n')
}
