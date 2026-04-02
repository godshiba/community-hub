import { GlassCard } from '@/components/glass/GlassCard'
import { useReportsStore } from '@/stores/reports.store'
import { Loader2, BarChart3 } from 'lucide-react'
import type { MetricCategory, ReportPeriod, ReportPlatformFilter } from '@shared/reports-types'

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' }
]

const PLATFORMS: { value: ReportPlatformFilter; label: string }[] = [
  { value: 'all', label: 'All Platforms' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' }
]

const METRICS: { value: MetricCategory; label: string; description: string }[] = [
  { value: 'growth', label: 'Growth', description: 'Member count trends and growth rate' },
  { value: 'engagement', label: 'Engagement', description: 'Active users and messages per user' },
  { value: 'retention', label: 'Retention', description: 'Retention and churn rates' },
  { value: 'moderation', label: 'Moderation', description: 'Warnings, bans, and resolutions' },
  { value: 'events', label: 'Events', description: 'Events held, RSVPs, attendance' }
]

export function ReportGenerator(): React.ReactElement {
  const {
    period, platformFilter, selectedMetrics,
    customStart, customEnd, generating,
    setPeriod, setPlatformFilter, toggleMetric,
    setCustomRange, generate
  } = useReportsStore()

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-text-primary">Report Period</h3>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                period === p.value
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'bg-glass-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">Start</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomRange(e.target.value, customEnd)}
                className="w-full bg-glass-surface border-glass rounded px-2 py-1.5 text-xs text-text-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">End</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomRange(customStart, e.target.value)}
                className="w-full bg-glass-surface border-glass rounded px-2 py-1.5 text-xs text-text-primary"
              />
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-text-primary">Platform</h3>
        <div className="flex gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatformFilter(p.value)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                platformFilter === p.value
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'bg-glass-surface text-text-muted hover:text-text-secondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-text-primary">Metrics</h3>
        <div className="space-y-2">
          {METRICS.map((m) => {
            const checked = selectedMetrics.includes(m.value)
            return (
              <label
                key={m.value}
                className="flex items-start gap-3 p-2 rounded hover:bg-glass-surface cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMetric(m.value)}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="text-xs font-medium text-text-primary">{m.label}</span>
                  <p className="text-xs text-text-muted">{m.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </GlassCard>

      <button
        onClick={generate}
        disabled={generating || selectedMetrics.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <BarChart3 className="size-4" />
            Generate Report
          </>
        )}
      </button>
    </div>
  )
}
