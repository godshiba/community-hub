import type { AgentProfile, AgentPattern } from '@shared/agent-types'

/** Builds the system prompt from agent profile and context */
export function buildSystemPrompt(
  profile: AgentProfile,
  patterns: readonly AgentPattern[]
): string {
  const parts: string[] = []

  parts.push(`You are ${profile.name}.`)

  if (profile.role) {
    parts.push(`Your role: ${profile.role}`)
  }

  if (profile.tone) {
    parts.push(`Communication style: ${profile.tone}`)
  }

  if (profile.language && profile.language !== 'en') {
    parts.push(`Primary language: ${profile.language}`)
  }

  if (profile.knowledge) {
    parts.push(`\nKnowledge base:\n${profile.knowledge}`)
  }

  if (profile.boundaries) {
    parts.push(`\nBoundaries and constraints:\n${profile.boundaries}`)
  }

  const enabledPatterns = patterns.filter((p) => p.enabled)
  if (enabledPatterns.length > 0) {
    parts.push('\nResponse patterns (use when matching):')
    for (const p of enabledPatterns) {
      parts.push(`- When ${p.triggerType} matches "${p.triggerValue}": ${p.responseTemplate}`)
    }
  }

  parts.push('\nKeep responses concise and helpful. If unsure, indicate low confidence.')

  return parts.join('\n')
}
