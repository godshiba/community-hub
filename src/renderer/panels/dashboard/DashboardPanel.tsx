import { useEffect, useState } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, Loader2 } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analytics.store'
import { PanelHeader } from '@/components/shared/PanelHeader'
import { SegmentedControl } from '@/components/shared/SegmentedControl'
import { StatsCards } from './StatsCards'
import { GrowthChart } from './GrowthChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { TopContributors } from './TopContributors'
import type { AnalyticsPeriod, PlatformFilter } from '@shared/analytics-types'

const PERIODS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' }
]

const PLATFORMS: Array<{ value: PlatformFilter; label: string; color: string }> = [
  { value: 'discord', label: 'Discord', color: 'text-discord' },
  { value: 'telegram', label: 'Telegram', color: 'text-telegram' }
]

export function DashboardPanel(): React.ReactElement {
  const { data, period, platform, loading, error, setPeriod, setPlatform, fetchStats, syncNow } =
    useAnalyticsStore()

  useEffect(() => {
    fetchStats()
  }, [])

  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExport(format: 'csv' | 'pdf'): Promise<void> {
    setExportError(null)
    const result = await window.api.invoke('analytics:exportStats', { format, period, platform })
    if (!result.success && result.error !== 'Export cancelled') {
      setExportError(result.error ?? 'Export failed')
    }
  }

  return (
    <GlassPanel className="p-4 space-y-4">
      <PanelHeader
        title="Dashboard"
        subtitle="Community analytics overview"
        actions={
          <>
            <SegmentedControl
              options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
              value={platform}
              onChange={(v) => setPlatform(v as PlatformFilter)}
            />
            <SegmentedControl
              options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
              value={period}
              onChange={(v) => setPeriod(v as AnalyticsPeriod)}
            />
            <Button size="sm" variant="outline" onClick={syncNow} disabled={loading}>
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Sync
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
              <Download className="size-3.5" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="size-3.5" /> PDF
            </Button>
          </>
        }
      />

      {/* Loading state (first load only) */}
      {loading && !data && !error && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      )}

      {/* Export error */}
      {exportError && (
        <div className="px-3 py-2 text-xs text-error bg-error/10 rounded">
          Export failed: {exportError}
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <p className="text-sm text-error">Failed to load analytics</p>
          <p className="text-xs mt-1">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={fetchStats}>
            Retry
          </Button>
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          <StatsCards stats={data.stats} />

          <div className="grid grid-cols-2 gap-3">
            <GrowthChart data={data.growth} platform={platform} />
            <ActivityHeatmap data={data.heatmap} />
          </div>

          <TopContributors data={data.contributors} />
        </>
      )}
    </GlassPanel>
  )
}
