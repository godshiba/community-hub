import { useEffect, useRef } from 'react'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { Button } from '@/components/ui/button'
import { RefreshCw, Download, Loader2 } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analytics.store'
import { StatsCards } from './StatsCards'
import { GrowthChart } from './GrowthChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { PlatformComparison } from './PlatformComparison'
import { TopContributors } from './TopContributors'
import type { AnalyticsPeriod } from '@shared/analytics-types'

const PERIODS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'day', label: '24h' },
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' }
]

const AUTO_REFRESH_MS = 30_000

export function DashboardPanel(): React.ReactElement {
  const { data, period, loading, error, autoRefresh, setPeriod, fetchStats, syncNow } = useAnalyticsStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, AUTO_REFRESH_MS)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchStats])

  async function handleExport(format: 'csv' | 'pdf'): Promise<void> {
    await window.api.invoke('analytics:exportStats', { format, period })
  }

  return (
    <GlassPanel className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Dashboard</h2>
          <p className="text-xs text-text-muted">Community analytics overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-glass-surface rounded-md border border-glass-border">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 text-xs transition-colors ${
                  period === p.value
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

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
        </div>
      </div>

      {/* Loading state (first load only) */}
      {loading && !data && !error && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-accent" />
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
            <GrowthChart data={data.growth} />
            <PlatformComparison data={data.comparison} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ActivityHeatmap data={data.heatmap} />
            <TopContributors data={data.contributors} />
          </div>
        </>
      )}
    </GlassPanel>
  )
}
