import { getDuePosts } from '../services/scheduler.repository'
import { sendPost } from '../ipc/scheduler'

let intervalId: ReturnType<typeof setInterval> | null = null

const CHECK_INTERVAL_MS = 30_000 // 30 seconds

async function checkAndSend(): Promise<void> {
  const duePosts = getDuePosts()

  for (const post of duePosts) {
    try {
      await sendPost(post.id)
    } catch {
      // markSent already handles error state inside sendPost
    }
  }
}

export function startPostSender(): void {
  if (intervalId) return

  // Check immediately on start
  checkAndSend().catch(() => {})

  intervalId = setInterval(() => {
    checkAndSend().catch(() => {})
  }, CHECK_INTERVAL_MS)
}

export function stopPostSender(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
