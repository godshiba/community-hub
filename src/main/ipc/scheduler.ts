import { registerHandler } from './register-handler'
import { getPlatformManager } from '../services/platform-manager'
import * as repo from '../services/scheduler.repository'
import type { ChannelInfo, PostHistoryEntry, SendResult } from '@shared/scheduler-types'
import type { Platform } from '@shared/settings-types'

export function registerSchedulerHandlers(): void {
  registerHandler('scheduler:createPost', (payload) => {
    return repo.createPost(payload)
  })

  registerHandler('scheduler:updatePost', (payload) => {
    const { id, ...rest } = payload
    return repo.updatePost(id, rest)
  })

  registerHandler('scheduler:getQueue', () => {
    return repo.getQueue()
  })

  registerHandler('scheduler:getHistory', () => {
    return repo.getHistory()
  })

  registerHandler('scheduler:cancelPost', (payload) => {
    repo.cancelPost(payload.id)
  })

  registerHandler('scheduler:sendNow', async (payload) => {
    return sendPost(payload.id)
  })

  registerHandler('scheduler:getChannels', () => {
    const mgr = getPlatformManager()
    const channels: ChannelInfo[] = [
      ...mgr.discord.listChannels(),
      ...mgr.telegram.listChannels()
    ]
    return channels
  })
}

/** Send a post to all its target platforms */
export async function sendPost(postId: number): Promise<SendResult> {
  const post = repo.getPost(postId)
  if (!post) throw new Error(`Post ${postId} not found`)

  // Prevent double-send for scheduled posts
  if (post.status === 'scheduled') {
    const locked = repo.markSending(postId)
    if (!locked) throw new Error(`Post ${postId} is already being sent`)
  }

  const mgr = getPlatformManager()
  const results: PostHistoryEntry[] = []
  let anySuccess = false

  for (const platform of post.platforms) {
    const channelId = post.channelIds[platform]
    if (!channelId) {
      const entry = recordFailure(postId, platform, `No channel selected for ${platform}`)
      results.push(entry)
      continue
    }

    const service = platform === 'discord' ? mgr.discord : mgr.telegram
    if (service.status !== 'connected') {
      const entry = recordFailure(postId, platform, `${platform} is not connected`)
      results.push(entry)
      continue
    }

    try {
      const { messageId } = await service.sendMessage(channelId, post.content)
      repo.insertHistory(postId, platform, messageId, true, null)
      results.push({
        id: 0,
        postId,
        platform: platform as Platform,
        platformMessageId: messageId,
        success: true,
        errorText: null,
        sentAt: new Date().toISOString()
      })
      anySuccess = true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Send failed'
      const entry = recordFailure(postId, platform, msg)
      results.push(entry)
    }
  }

  repo.markSent(postId, anySuccess, anySuccess ? undefined : 'All platforms failed')

  return { postId, results }
}

function recordFailure(postId: number, platform: string, error: string): PostHistoryEntry {
  repo.insertHistory(postId, platform, null, false, error)
  return {
    id: 0,
    postId,
    platform: platform as Platform,
    platformMessageId: null,
    success: false,
    errorText: error,
    sentAt: new Date().toISOString()
  }
}
