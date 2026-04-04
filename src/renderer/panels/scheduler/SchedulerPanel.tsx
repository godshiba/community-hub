import { useEffect } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useSchedulerStore } from '@/stores/scheduler.store'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { SegmentedControl } from '@/components/shared/SegmentedControl'
import { PostEditor } from './PostEditor'
import { PostQueue } from './PostQueue'
import { PostHistory } from './PostHistory'

export function SchedulerPanel(): React.ReactElement {
  const { tab, setTab, fetchQueue, fetchHistory } = useSchedulerStore()

  useEffect(() => {
    fetchQueue()
    fetchHistory()
  }, [])

  return (
    <GlassPanel className="p-4 space-y-4 overflow-y-auto">
      <PanelHeader title="Scheduler" subtitle="Schedule posts and messages" />

      {/* Post editor */}
      <PostEditor />

      <SegmentedControl
        options={[
          { value: 'queue', label: 'Queue' },
          { value: 'history', label: 'History' }
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'queue' | 'history')}
      />

      {tab === 'queue' ? <PostQueue /> : <PostHistory />}
    </GlassPanel>
  )
}
