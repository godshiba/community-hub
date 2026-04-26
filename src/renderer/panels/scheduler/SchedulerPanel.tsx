import { useEffect, useState, type CSSProperties } from 'react'
import { Plus } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { Button } from '@/components/ui-native/Button'
import { Tooltip } from '@/components/ui-native/Tooltip'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { PostEditor } from './PostEditor'
import { PostQueue } from './PostQueue'
import { PostHistory } from './PostHistory'
import { PostPreview } from './PostPreview'

const TAB_OPTIONS = [
  { value: 'queue',   label: 'Queue'   },
  { value: 'history', label: 'History' }
] as const satisfies ReadonlyArray<{ value: 'queue' | 'history'; label: string }>

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  height: '100%',
  minHeight: 0,
  maxWidth: 1400,
  width: '100%',
  marginInline: 'auto'
}

export function SchedulerPanel(): React.ReactElement {
  const tab          = useSchedulerStore((s) => s.tab)
  const setTab       = useSchedulerStore((s) => s.setTab)
  const fetchQueue   = useSchedulerStore((s) => s.fetchQueue)
  const fetchHistory = useSchedulerStore((s) => s.fetchHistory)

  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedQueueId, setSelectedQueueId] = useState<number | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)

  useEffect(() => {
    void fetchQueue()
    void fetchHistory()
  }, [fetchQueue, fetchHistory])

  useEffect(() => {
    const onNewPost = (): void => setEditorOpen(true)
    window.addEventListener('panel:newPost', onNewPost)
    return () => window.removeEventListener('panel:newPost', onNewPost)
  }, [])

  const selectedId = tab === 'queue' ? selectedQueueId : selectedHistoryId

  usePanelToolbar({
    title: 'Scheduler',
    inspector: {
      enabled: true,
      renderEmpty: () => <PostPreview selectedPostId={selectedId} source={tab} />
    },
    actions: (
      <>
        <SegmentedControl
          size="sm"
          ariaLabel="Scheduler view"
          options={TAB_OPTIONS}
          value={tab}
          onChange={(v) => setTab(v)}
        />
        <Tooltip label="New post" shortcut={['⌘', 'N']} side="bottom">
          <Button
            variant="primary"
            size="sm"
            leading={<Plus size={13} weight="bold" />}
            onClick={() => setEditorOpen(true)}
          >
            New post
          </Button>
        </Tooltip>
      </>
    )
  })

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Scheduler" />
      {tab === 'queue'
        ? <PostQueue selectedId={selectedQueueId} onSelect={setSelectedQueueId} />
        : <PostHistory selectedId={selectedHistoryId} onSelect={setSelectedHistoryId} />}
      <PostEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  )
}
