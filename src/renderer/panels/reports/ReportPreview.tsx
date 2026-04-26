import { memo, type CSSProperties } from 'react'
import { Download, Sparkle, FileText, SpinnerGap } from '@phosphor-icons/react'
import { useReportsStore } from '@/stores/reports.store'
import { Surface } from '@/components/ui-native/Surface'
import { Button } from '@/components/ui-native/Button'
import { ProgressBar } from '@/components/ui-native/ProgressBar'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { Divider } from '@/components/ui-native/Divider'
import { GrowthReportChart } from './charts/GrowthReportChart'
import { EngagementChart } from './charts/EngagementChart'
import { MetricCard } from './MetricCard'

const SECTION: CSSProperties = {
  padding: 'var(--space-4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)'
}

const SECTION_TITLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-fg-primary)',
  margin: 0
}

const GRID_3: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 'var(--space-3)'
}

const GRID_2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--space-3)'
}

interface ReportPreviewProps {
  generating?: boolean
}

export const ReportPreview = memo(function ReportPreview({ generating = false }: ReportPreviewProps): React.ReactElement {
  const currentReport = useReportsStore((s) => s.currentReport)
  const exporting     = useReportsStore((s) => s.exporting)
  const exportPdf     = useReportsStore((s) => s.exportPdf)

  if (generating && !currentReport) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <SpinnerGap size={32} weight="bold" style={{ animation: 'button-spin 1.2s linear infinite', color: 'var(--color-accent)' }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Generating report…</div>
        <ProgressBar ariaLabel="Generating report" />
      </Surface>
    )
  }

  if (!currentReport) {
    return (
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <EmptyState
          size="lg"
          icon={<FileText size={56} />}
          title="No report yet"
          subtitle="Pick a date range and sections in the Inspector, then press Generate."
        />
      </Surface>
    )
  }

  const { data } = currentReport

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Surface variant="raised" radius="lg" bordered style={{ ...SECTION, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-fg-primary)' }}>{currentReport.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-fg-tertiary)', marginTop: 4 }}>
            {new Date(data.periodStart).toLocaleDateString()} – {new Date(data.periodEnd).toLocaleDateString()}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          leading={<Download size={13} weight="bold" />}
          onClick={() => { void exportPdf(currentReport.id) }}
          isLoading={exporting}
        >
          Export PDF
        </Button>
      </Surface>

      {data.growth && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <h3 style={SECTION_TITLE}>Growth</h3>
          <div style={GRID_3}>
            <MetricCard label="Current members" value={data.growth.currentMembers} />
            <MetricCard label="Previous members" value={data.growth.previousMembers} />
            <MetricCard
              label="Growth rate"
              value={`${data.growth.growthRate > 0 ? '+' : ''}${data.growth.growthRate}%`}
              positive={data.growth.growthRate > 0}
              negative={data.growth.growthRate < 0}
            />
          </div>
          {data.growth.growthData.length > 0 && (
            <>
              <Divider />
              <GrowthReportChart data={data.growth.growthData} />
            </>
          )}
        </Surface>
      )}

      {data.engagement && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <h3 style={SECTION_TITLE}>Engagement</h3>
          <div style={GRID_2}>
            <MetricCard label="Engagement rate" value={`${data.engagement.engagementRate}%`} />
            <MetricCard label="Messages / user" value={data.engagement.messagesPerUser} />
            <MetricCard label="Active users" value={data.engagement.activeUsers} />
            <MetricCard label="Total users" value={data.engagement.totalUsers} />
          </div>
          <Divider />
          <EngagementChart
            discord={data.engagement.discordEngagement}
            telegram={data.engagement.telegramEngagement}
          />
        </Surface>
      )}

      {data.retention && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <h3 style={SECTION_TITLE}>Retention</h3>
          <div style={GRID_2}>
            <MetricCard
              label="Retention rate"
              value={`${data.retention.retentionRate}%`}
              positive={data.retention.retentionRate > 80}
              negative={data.retention.retentionRate < 50}
            />
            <MetricCard
              label="Churn rate"
              value={`${data.retention.churnRate}%`}
              positive={data.retention.churnRate < 20}
              negative={data.retention.churnRate > 50}
            />
            <MetricCard label="New users" value={data.retention.newUsers} />
            <MetricCard label="End users" value={data.retention.endUsers} />
          </div>
        </Surface>
      )}

      {data.moderation && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <h3 style={SECTION_TITLE}>Moderation</h3>
          <div style={GRID_2}>
            <MetricCard label="Warnings" value={data.moderation.totalWarnings} />
            <MetricCard label="Bans" value={data.moderation.totalBans} />
            <MetricCard label="Resolved" value={data.moderation.resolved} />
            <MetricCard label="Pending" value={data.moderation.pending} />
          </div>
        </Surface>
      )}

      {data.events && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <h3 style={SECTION_TITLE}>Events</h3>
          <div style={GRID_3}>
            <MetricCard label="Events held" value={data.events.eventsHeld} />
            <MetricCard label="Total RSVPs" value={data.events.totalRSVPs} />
            <MetricCard label="Attendance" value={`${data.events.attendanceRate}%`} />
          </div>
        </Surface>
      )}

      {data.aiNarrative && (
        <Surface variant="raised" radius="lg" bordered style={SECTION}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkle size={14} color="var(--color-accent)" weight="fill" />
            <h3 style={SECTION_TITLE}>AI insights</h3>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-fg-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {data.aiNarrative}
          </p>
        </Surface>
      )}
    </div>
  )
})
