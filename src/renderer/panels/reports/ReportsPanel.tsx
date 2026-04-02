import { GlassPanel } from '@/components/glass/GlassPanel'
import { useReportsStore } from '@/stores/reports.store'
import { ReportGenerator } from './ReportGenerator'
import { ReportPreview } from './ReportPreview'
import { ReportHistory } from './ReportHistory'
import { AlertCircle, X } from 'lucide-react'

type Tab = 'generator' | 'history'

export function ReportsPanel(): React.ReactElement {
  const { view, error, setView, clearError } = useReportsStore()

  // Map view to active tab for the toggle (preview is accessed from generator)
  const activeTab: Tab = view === 'history' ? 'history' : 'generator'

  return (
    <GlassPanel className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Reports</h2>
          <p className="text-xs text-text-secondary">Community health reports and analytics</p>
        </div>
        <div className="flex items-center gap-1 bg-glass-surface rounded p-0.5">
          <button
            onClick={() => setView('generator')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'generator'
                ? 'bg-accent/20 text-accent font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'history'
                ? 'bg-accent/20 text-accent font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="shrink-0 hover:text-red-300">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Content */}
      {view === 'generator' && <ReportGenerator />}
      {view === 'preview' && <ReportPreview />}
      {view === 'history' && <ReportHistory />}
    </GlassPanel>
  )
}
