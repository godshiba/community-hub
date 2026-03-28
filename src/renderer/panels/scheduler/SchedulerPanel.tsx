import { useEffect } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { useSchedulerStore } from '@/stores/scheduler.store'
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
      {/* Post editor */}
      <PostEditor />

      {/* Queue / History tabs */}
      <div className="flex items-center gap-1 border-b border-glass-border">
        <button
          onClick={() => setTab('queue')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === 'queue'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          Queue
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === 'history'
              ? 'text-accent border-b-2 border-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          History
        </button>
      </div>

      {tab === 'queue' ? <PostQueue /> : <PostHistory />}
    </GlassPanel>
  )
}
