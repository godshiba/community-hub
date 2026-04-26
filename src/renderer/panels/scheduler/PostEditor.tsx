import { useState, useEffect, type CSSProperties } from 'react'
import { Clock, FloppyDisk, PaperPlaneTilt } from '@phosphor-icons/react'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { Sheet } from '@/components/ui-native/Sheet'
import { TextField } from '@/components/ui-native/TextField'
import { Select } from '@/components/ui-native/Select'
import { Button } from '@/components/ui-native/Button'
import { FormRow } from '@/components/ui-native/FormRow'
import { Toggle } from '@/components/ui-native/Toggle'
import { Editor } from '@/components/editor/Editor'
import type { Platform } from '@shared/settings-types'
import type { ChannelInfo, PostPayload } from '@shared/scheduler-types'

interface PostEditorProps {
  open: boolean
  onClose: () => void
}

const CHAR_COUNT_STYLE: CSSProperties = {
  textAlign: 'right',
  fontSize: 11,
  color: 'var(--color-fg-tertiary)',
  marginTop: -4
}

export function PostEditor({ open, onClose }: PostEditorProps): React.ReactElement {
  const channels      = useSchedulerStore((s) => s.channels)
  const fetchChannels = useSchedulerStore((s) => s.fetchChannels)
  const createPost    = useSchedulerStore((s) => s.createPost)
  const sendNow       = useSchedulerStore((s) => s.sendNow)
  const loading       = useSchedulerStore((s) => s.loading)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({ discord: false, telegram: false })
  const [channelIds, setChannelIds] = useState<Record<Platform, string>>({ discord: '', telegram: '' })
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    if (open) void fetchChannels()
  }, [open, fetchChannels])

  function reset(): void {
    setTitle(''); setContent('')
    setPlatforms({ discord: false, telegram: false })
    setChannelIds({ discord: '', telegram: '' })
    setScheduledTime('')
  }

  function close(): void { reset(); onClose() }

  function channelOptions(platform: Platform): { value: string; label: string }[] {
    return channels
      .filter((c: ChannelInfo) => c.platform === platform)
      .map((ch) => ({ value: ch.id, label: ch.guildName ? `${ch.guildName} / #${ch.name}` : ch.name }))
  }

  function selectedPlatforms(): Platform[] {
    return (Object.keys(platforms) as Platform[]).filter((p) => platforms[p])
  }

  async function submit(mode: 'draft' | 'schedule' | 'send'): Promise<void> {
    const list = selectedPlatforms()
    if (!content.trim() || list.length === 0) return
    const payload: PostPayload = {
      title: title.trim(),
      content: content.trim(),
      platforms: list,
      channelIds,
      scheduledTime: mode === 'schedule' && scheduledTime ? new Date(scheduledTime).toISOString() : null
    }
    const post = await createPost(payload)
    if (!post) return
    if (mode === 'send') await sendNow(post.id)
    close()
  }

  const canSubmit = content.trim().length > 0 && selectedPlatforms().length > 0

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => { if (!o) close() }}
      title="New post"
      width="md"
      ariaLabel="New post"
      footer={
        <>
          <Button variant="plain" onClick={close}>Cancel</Button>
          <Button
            variant="secondary"
            size="md"
            leading={<FloppyDisk size={13} />}
            onClick={() => { void submit('draft') }}
            disabled={!canSubmit}
            isLoading={loading}
          >
            Save draft
          </Button>
          {scheduledTime && (
            <Button
              variant="secondary"
              size="md"
              leading={<Clock size={13} />}
              onClick={() => { void submit('schedule') }}
              disabled={!canSubmit}
              isLoading={loading}
            >
              Schedule
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            leading={<PaperPlaneTilt size={13} />}
            onClick={() => { void submit('send') }}
            disabled={!canSubmit}
            isLoading={loading}
          >
            Send now
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormRow label="Title" optional>
          <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" />
        </FormRow>

        <FormRow label="Content" required>
          <Editor
            value={content}
            onChange={setContent}
            placeholder="Write your message… **bold**, *italic*, `code`, lists, links."
            ariaLabel="Post content"
          />
        </FormRow>
        <div style={CHAR_COUNT_STYLE}>{content.length} chars</div>

        <FormRow label="Platforms" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['discord', 'telegram'] as const).map((p) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Toggle
                  checked={platforms[p]}
                  onChange={(v) => setPlatforms((prev) => ({ ...prev, [p]: v }))}
                  label={p === 'discord' ? 'Discord' : 'Telegram'}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-fg-primary)', minWidth: 64 }}>
                  {p === 'discord' ? 'Discord' : 'Telegram'}
                </span>
                {platforms[p] && (
                  <Select
                    size="sm"
                    value={channelIds[p] || null}
                    onChange={(v) => setChannelIds((prev) => ({ ...prev, [p]: v }))}
                    options={channelOptions(p)}
                    placeholder="Select channel…"
                    fullWidth
                    ariaLabel={`${p} channel`}
                  />
                )}
              </div>
            ))}
          </div>
        </FormRow>

        <FormRow label="Schedule" optional>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TextField
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              fullWidth={false}
              containerStyle={{ flex: 1 }}
            />
            {scheduledTime && (
              <Button variant="plain" size="sm" onClick={() => setScheduledTime('')}>Clear</Button>
            )}
          </div>
        </FormRow>
      </div>
    </Sheet>
  )
}
