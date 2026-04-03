import { useState, useEffect, memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Send, Clock, Save } from 'lucide-react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import type { Platform } from '@shared/settings-types'
import type { ChannelInfo, PostPayload } from '@shared/scheduler-types'

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string; color: string }> = [
  { value: 'discord', label: 'Discord', color: 'text-discord' },
  { value: 'telegram', label: 'Telegram', color: 'text-telegram' }
]

export const PostEditor = memo(function PostEditor(): React.ReactElement {
  const { channels, fetchChannels, createPost, loading } = useSchedulerStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [channelIds, setChannelIds] = useState<Record<Platform, string>>({ discord: '', telegram: '' })
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    fetchChannels()
  }, [])

  const channelsFor = (platform: Platform): readonly ChannelInfo[] =>
    channels.filter((c) => c.platform === platform)

  function togglePlatform(p: Platform): void {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function resetForm(): void {
    setTitle('')
    setContent('')
    setPlatforms([])
    setChannelIds({ discord: '', telegram: '' })
    setScheduledTime('')
  }

  async function handleSubmit(mode: 'draft' | 'schedule' | 'send'): Promise<void> {
    if (!content.trim() || platforms.length === 0) return

    const payload: PostPayload = {
      title: title.trim(),
      content: content.trim(),
      platforms,
      channelIds,
      scheduledTime: mode === 'schedule' && scheduledTime ? new Date(scheduledTime).toISOString() : null
    }

    const post = await createPost(payload)
    if (!post) return

    if (mode === 'send') {
      await useSchedulerStore.getState().sendNow(post.id)
    }

    resetForm()
  }

  return (
    <GlassCard className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-text-primary">New Post</h3>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title (optional)"
        className="w-full bg-glass-surface border border-glass-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your message..."
        rows={6}
        className="w-full bg-glass-surface border border-glass-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
      />
      <div className="flex justify-end">
        <span className="text-xs text-text-muted">{content.length} chars</span>
      </div>

      {/* Platform toggles + channel selectors */}
      <div className="space-y-3">
        {PLATFORM_OPTIONS.map((p) => (
          <div key={p.value} className="flex items-center gap-3">
            <button
              onClick={() => togglePlatform(p.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
                platforms.includes(p.value)
                  ? `bg-accent/20 ${p.color} border-accent/40`
                  : 'text-text-muted border-glass-border hover:text-text-secondary'
              }`}
            >
              {p.label}
            </button>

            {platforms.includes(p.value) && (
              <select
                value={channelIds[p.value]}
                onChange={(e) => setChannelIds((prev) => ({ ...prev, [p.value]: e.target.value }))}
                className="flex-1 bg-glass-surface border border-glass-border rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Select channel...</option>
                {channelsFor(p.value).map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.guildName ? `${ch.guildName} / #${ch.name}` : ch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Schedule time */}
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-text-muted" />
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="bg-glass-surface border border-glass-border rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {scheduledTime && (
          <button onClick={() => setScheduledTime('')} className="text-xs text-text-muted hover:text-error">
            Clear
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={loading || !content.trim() || platforms.length === 0}
        >
          <Save className="size-3.5" /> Save Draft
        </Button>

        {scheduledTime && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSubmit('schedule')}
            disabled={loading || !content.trim() || platforms.length === 0}
          >
            <Clock className="size-3.5" /> Schedule
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => handleSubmit('send')}
          disabled={loading || !content.trim() || platforms.length === 0}
          className="bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30"
        >
          <Send className="size-3.5" /> Send Now
        </Button>
      </div>
    </GlassCard>
  )
})
