import { useEffect, memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useReportsStore } from '@/stores/reports.store'
import { FileText, Trash2, Loader2 } from 'lucide-react'

export const ReportHistory = memo(function ReportHistory(): React.ReactElement {
  const { reports, historyLoading, fetchHistory, viewReport, deleteReport } = useReportsStore()

  useEffect(() => { fetchHistory() }, [])

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-text-muted" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <FileText className="size-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">No reports generated yet</p>
        <p className="text-xs text-text-muted mt-1">
          Generate your first report from the generator tab
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <GlassCard
          key={report.id}
          className="p-3 flex items-center justify-between hover:bg-glass-raised/80 cursor-pointer transition-colors"
          onClick={() => viewReport(report)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="size-4 text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {report.title}
              </p>
              <p className="text-xs text-text-muted">
                {new Date(report.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteReport(report.id)
            }}
            className="p-1.5 text-text-muted hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 className="size-3.5" />
          </button>
        </GlassCard>
      ))}
    </div>
  )
})
