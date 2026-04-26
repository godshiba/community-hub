import { useEffect, memo } from 'react'
import { FileText, Trash } from '@phosphor-icons/react'
import { useReportsStore } from '@/stores/reports.store'
import { Surface } from '@/components/ui-native/Surface'
import { ListRow } from '@/components/ui-native/ListRow'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { Skeleton } from '@/components/ui-native/Skeleton'

export const ReportHistory = memo(function ReportHistory(): React.ReactElement {
  const reports        = useReportsStore((s) => s.reports)
  const historyLoading = useReportsStore((s) => s.historyLoading)
  const fetchHistory   = useReportsStore((s) => s.fetchHistory)
  const viewReport     = useReportsStore((s) => s.viewReport)
  const deleteReport   = useReportsStore((s) => s.deleteReport)
  const currentReport  = useReportsStore((s) => s.currentReport)

  useEffect(() => { void fetchHistory() }, [fetchHistory])

  if (historyLoading && reports.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" height={48} />)}
      </Surface>
    )
  }

  if (reports.length === 0) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <EmptyState
          size="md"
          icon={<FileText size={40} />}
          title="No reports yet"
          subtitle="Switch to Generate to build your first report."
        />
      </Surface>
    )
  }

  return (
    <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {reports.map((report) => (
        <ListRow
          key={report.id}
          density="comfortable"
          selected={currentReport?.id === report.id}
          onSelect={() => viewReport(report)}
          leading={<FileText size={16} color="var(--color-accent)" />}
          title={report.title}
          subtitle={new Date(report.createdAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
          trailing={
            <button
              aria-label="Delete report"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); void deleteReport(report.id) }}
              style={{
                background: 'transparent',
                border: 'none',
                width: 24,
                height: 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                cursor: 'pointer',
                color: 'var(--color-fg-tertiary)'
              }}
            >
              <Trash size={13} />
            </button>
          }
        />
      ))}
    </Surface>
  )
})
