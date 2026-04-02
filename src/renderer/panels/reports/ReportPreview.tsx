import { GlassCard } from '@/components/glass/GlassCard'
import { useReportsStore } from '@/stores/reports.store'
import { ArrowLeft, Download, Loader2, Sparkles } from 'lucide-react'
import { GrowthReportChart } from './charts/GrowthReportChart'
import { EngagementChart } from './charts/EngagementChart'
import { MetricCard } from './MetricCard'

export function ReportPreview(): React.ReactElement {
  const { currentReport, exporting, setView, exportPdf } = useReportsStore()

  if (!currentReport) return <></>

  const { data } = currentReport

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('generator')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Generator
        </button>
        <button
          onClick={() => exportPdf(currentReport.id)}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Export PDF
        </button>
      </div>

      {/* Title */}
      <GlassCard className="p-4">
        <h3 className="text-base font-semibold text-text-primary">{currentReport.title}</h3>
        <p className="text-xs text-text-muted mt-1">
          {new Date(data.periodStart).toLocaleDateString()} - {new Date(data.periodEnd).toLocaleDateString()}
        </p>
      </GlassCard>

      {/* Growth */}
      {data.growth && (
        <GlassCard className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Growth</h4>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Current Members" value={data.growth.currentMembers} />
            <MetricCard label="Previous Members" value={data.growth.previousMembers} />
            <MetricCard
              label="Growth Rate"
              value={`${data.growth.growthRate > 0 ? '+' : ''}${data.growth.growthRate}%`}
              positive={data.growth.growthRate > 0}
              negative={data.growth.growthRate < 0}
            />
          </div>
          {data.growth.growthData.length > 0 && (
            <GrowthReportChart data={data.growth.growthData} />
          )}
        </GlassCard>
      )}

      {/* Engagement */}
      {data.engagement && (
        <GlassCard className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Engagement</h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Engagement Rate" value={`${data.engagement.engagementRate}%`} />
            <MetricCard label="Messages/User" value={data.engagement.messagesPerUser} />
            <MetricCard label="Active Users" value={data.engagement.activeUsers} />
            <MetricCard label="Total Users" value={data.engagement.totalUsers} />
          </div>
          <EngagementChart
            discord={data.engagement.discordEngagement}
            telegram={data.engagement.telegramEngagement}
          />
        </GlassCard>
      )}

      {/* Retention */}
      {data.retention && (
        <GlassCard className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Retention</h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Retention Rate"
              value={`${data.retention.retentionRate}%`}
              positive={data.retention.retentionRate > 80}
              negative={data.retention.retentionRate < 50}
            />
            <MetricCard
              label="Churn Rate"
              value={`${data.retention.churnRate}%`}
              positive={data.retention.churnRate < 20}
              negative={data.retention.churnRate > 50}
            />
            <MetricCard label="New Users" value={data.retention.newUsers} />
            <MetricCard label="End Users" value={data.retention.endUsers} />
          </div>
        </GlassCard>
      )}

      {/* Moderation */}
      {data.moderation && (
        <GlassCard className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Moderation</h4>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Warnings" value={data.moderation.totalWarnings} />
            <MetricCard label="Bans" value={data.moderation.totalBans} />
            <MetricCard label="Resolved" value={data.moderation.resolved} />
            <MetricCard label="Pending" value={data.moderation.pending} />
          </div>
        </GlassCard>
      )}

      {/* Events */}
      {data.events && (
        <GlassCard className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-primary">Events</h4>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Events Held" value={data.events.eventsHeld} />
            <MetricCard label="Total RSVPs" value={data.events.totalRSVPs} />
            <MetricCard label="Attendance" value={`${data.events.attendanceRate}%`} />
          </div>
        </GlassCard>
      )}

      {/* AI Narrative */}
      {data.aiNarrative && (
        <GlassCard className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <h4 className="text-sm font-medium text-text-primary">AI Insights</h4>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {data.aiNarrative}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
