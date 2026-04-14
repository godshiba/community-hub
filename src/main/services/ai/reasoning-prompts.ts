import type { AgentProfile } from '@shared/agent-types'
import type { AssembledContext, IntentClassification } from '@shared/agent-brain-types'

/**
 * Build the main reasoning prompt from agent profile and assembled context.
 * Returns the system prompt for the reasoning LLM call.
 */
export function buildReasoningPrompt(
  profile: AgentProfile,
  assembled: AssembledContext,
  intent: IntentClassification
): string {
  const parts: string[] = []

  // Agent identity
  parts.push(`You are ${profile.name}, assisting a community member.`)
  if (profile.role) parts.push(`Your role: ${profile.role}`)
  if (profile.tone) parts.push(`Communication style: ${profile.tone}`)
  if (profile.boundaries) parts.push(`Boundaries: ${profile.boundaries}`)

  // Channel context
  if (assembled.channelContext) {
    parts.push(`\n== Channel ==\n${assembled.channelContext}`)
  }

  // User profile
  parts.push(`\n== User Profile ==\n${assembled.userProfile}`)

  // Member profile
  if (assembled.memberProfile) {
    parts.push(`\n== Community Member Record ==\n${assembled.memberProfile}`)
  }

  // Conversation history
  if (assembled.conversationHistory) {
    parts.push(`\n== Conversation History ==\n${assembled.conversationHistory}`)
  }

  // Knowledge context
  if (assembled.knowledgeContext) {
    parts.push(`\n== Reference Material ==\n${assembled.knowledgeContext}`)
  }

  // Available actions
  parts.push(`\n== Available Actions ==\nYou can take these actions by including them in your response:\n${assembled.availableActions}`)

  // Intent hint
  parts.push(`\nDetected intent: ${intent.intent} (confidence: ${intent.confidence.toFixed(2)})`)
  if (intent.isUrgent) parts.push('This message appears urgent - prioritize it.')

  // Response format instructions
  parts.push(REASONING_FORMAT_INSTRUCTIONS)

  return parts.join('\n')
}

const REASONING_FORMAT_INSTRUCTIONS = `
== Instructions ==
Think step by step about what this user needs.
Respond with JSON only, no markdown fences:
{
  "thought": "your internal reasoning (not shown to user)",
  "response": "your message to the user",
  "actions": [{ "type": "action_name", "params": {} }],
  "memory_updates": ["fact to remember about this user"],
  "confidence": 0.0-1.0
}

Rules:
- Keep responses concise and natural
- Only add memory_updates for genuinely useful facts (language preference, expertise, ongoing issues)
- Use actions sparingly - most messages need "none" or no actions
- If you reference knowledge, synthesize naturally - don't quote entry numbers
- For greetings from returning users, be warm and reference what you know about them
- Set confidence based on how well you can answer: 1.0 = certain, 0.5 = moderate, 0.0 = guessing`

/**
 * Build the summary prompt for conversation compaction.
 */
export function buildSummaryPrompt(
  turns: readonly { userMessage: string; agentResponse: string }[]
): string {
  const transcript = turns.map((t) =>
    `User: ${t.userMessage}\nAgent: ${t.agentResponse}`
  ).join('\n\n')

  return `Summarize this conversation between a community member and an AI assistant into 2-3 paragraphs. Focus on: topics discussed, problems resolved or pending, user preferences, and any commitments made. Do not include greetings or small talk.

Conversation:
${transcript}

Summary:`
}
