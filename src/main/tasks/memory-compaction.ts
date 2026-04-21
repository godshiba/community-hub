import { getAgentService } from '../services/ai/agent.service'
import * as memoryRepo from '../services/ai/user-memory.repository'
import { buildSummaryPrompt } from '../services/ai/reasoning-prompts'

let intervalId: ReturnType<typeof setInterval> | null = null

/** Compaction runs every 6 hours */
const COMPACTION_INTERVAL_MS = 6 * 60 * 60 * 1000

/** Users with more than this many turns get compacted */
const TURN_THRESHOLD = 50

/** Number of oldest turns to summarize per compaction run */
const TURNS_TO_SUMMARIZE = 40

/** Max users to compact per run */
const MAX_USERS_PER_RUN = 10

// TODO: Replace with BrainConfig.maxSummaryLength once brain-config service is available
/** Maximum character length for conversation summaries */
const MAX_SUMMARY_LENGTH = 2000

export async function runCompaction(): Promise<number> {
  const agent = getAgentService()
  if (!agent.isActive() || !agent.provider) return 0

  const users = memoryRepo.getUsersWithManyTurns(TURN_THRESHOLD, MAX_USERS_PER_RUN)
  let compacted = 0

  for (const user of users) {
    try {
      const oldestTurns = memoryRepo.getOldestTurns(
        user.platform,
        user.platformUserId,
        TURNS_TO_SUMMARIZE
      )

      if (oldestTurns.length < TURNS_TO_SUMMARIZE) continue

      // Build summary prompt
      const prompt = buildSummaryPrompt(
        oldestTurns.map((t) => ({
          userMessage: t.userMessage,
          agentResponse: t.agentResponse
        }))
      )

      // Use the LLM to summarize
      const summary = await agent.provider.complete(
        'You summarize conversations concisely. Focus on key topics, resolutions, and user preferences.',
        prompt
      )

      // Get existing summary and append
      const memory = memoryRepo.getUserMemory(user.platform, user.platformUserId)
      const existingSummary = memory?.conversationSummary ?? ''
      let newSummary = existingSummary
        ? `${existingSummary}\n\n${summary}`
        : summary

      // Cap summary length to prevent unbounded growth
      if (newSummary.length > MAX_SUMMARY_LENGTH) {
        try {
          newSummary = await agent.provider.complete(
            'You compress conversation summaries. Keep the most important facts, topics, and user preferences. Output only the compressed summary, nothing else.',
            `Compress this summary to under ${Math.floor(MAX_SUMMARY_LENGTH / 2)} characters:\n\n${newSummary}`
          )
        } catch {
          // LLM re-summarization failed; hard-truncate to cap
          newSummary = newSummary.slice(0, MAX_SUMMARY_LENGTH) + '...'
        }
      }

      // Update summary and delete old turns
      memoryRepo.updateSummary(user.platform, user.platformUserId, newSummary)
      memoryRepo.deleteTurns(oldestTurns.map((t) => t.id))
      compacted++
    } catch {
      // Non-fatal: skip this user and continue
    }
  }

  return compacted
}

export function startMemoryCompaction(): void {
  if (intervalId) return

  // Run once on startup (delayed 5 min to not compete with other startup tasks)
  setTimeout(() => {
    runCompaction().catch(() => {})
  }, 5 * 60 * 1000)

  intervalId = setInterval(() => {
    runCompaction().catch(() => {})
  }, COMPACTION_INTERVAL_MS)
}

export function stopMemoryCompaction(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
