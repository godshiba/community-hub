import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowClockwise, CaretDown, Download, WarningCircle } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useAnalyticsStore } from '@/stores/analytics.store'
import { Button } from '@/components/ui-native/Button'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { DropdownMenu } from '@/components/ui-native/DropdownMenu'
import { Tooltip } from '@/components/ui-native/Tooltip'
import { EmptyState } from '@/components/ui-native/EmptyState'
import { Skeleton } from '@/components/ui-native/Skeleton'
import { Surface } from '@/components/ui-native/Surface'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { StatsCards } from './StatsCards'
import { GrowthChart } from './GrowthChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { TopContributors } from './TopContributors'
import type { AnalyticsPeriod, PlatformFilter } from '@shared/analytics-types'

const PERIOD_OPTIONS = [
  { value: 'day',   label: '24h' },
  { value: 'week',  label: '7d'  },
  { value: 'month', label: '30d' }
] as const satisfies ReadonlyArray<{ value: AnalyticsPeriod; label: string }>

const PLATFORM_OPTIONS = [
  { value: 'discord',  label: 'Discord'  },
  { value: 'telegram', label: 'Telegram' }
] as const satisfies ReadonlyArray<{ value: PlatformFilter; label: string }>

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  maxWidth: 1400,
  marginInline: 'auto'
}

const SPLIT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 'var(--space-4)'
}

const ERROR_BANNER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  paddingInline: 'var(--space-3)',
  paddingBlock: 'var(--space-2)',
  fontSize: 12,
  color: 'var(--color-error)',
  background: 'color-mix(in oklch, var(--color-error) 12%, transparent)',
  border: '1px solid color-mix(in oklch, var(--color-error) 28%, transparent)',
  borderRadius: 'var(--radius-md)'
}

function DashboardSkeleton(): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Surface key={i} variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)', minHeight: 110 }}>
            <Skeleton variant="line" width={80} height={10} />
            <div style={{ height: 12 }} />
            <Skeleton variant="line" width={120} height={22} />
            <div style={{ height: 12 }} />
            <Skeleton variant="line" width={100} height={10} />
          </Surface>
        ))}
      </div>
      <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
        <Skeleton variant="rect" height={240} />
      </Surface>
      <div style={SPLIT_GRID}>
        <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
          <Skeleton variant="rect" height={180} />
        </Surface>
        <Surface variant="raised" radius="lg" bordered style={{ padding: 'var(--space-4)' }}>
          <Skeleton variant="rect" height={180} />
        </Surface>
      </div>
    </div>
  )
}

export function DashboardPanel(): React.ReactElement {
  const data = useAnalyticsStore((s) => s.data)
  const period = useAnalyticsStore((s) => s.period)
  const platform = useAnalyticsStore((s) => s.platform)
  const loading = useAnalyticsStore((s) => s.loading)
  const error = useAnalyticsStore((s) => s.error)
  const setPeriod = useAnalyticsStore((s) => s.setPeriod)
  const setPlatform = useAnalyticsStore((s) => s.setPlatform)
  const fetchStats = useAnalyticsStore((s) => s.fetchStats)
  const syncNow = useAnalyticsStore((s) => s.syncNow)

  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => { void fetchStats() }, [fetchStats])

  async function handleExport(format: 'csv' | 'pdf'): Promise<void> {
    setExportError(null)
    const result = await window.api.invoke('analytics:exportStats', { format, period, platform })
    if (!result.success && result.error !== 'Export cancelled') {
      setExportError(result.error ?? 'Export failed')
    }
  }

  const exportItems = useMemo(
    () => [
      { id: 'csv', label: 'Export as CSV', onSelect: () => { void handleExport('csv') } },
      { id: 'pdf', label: 'Export as PDF', onSelect: () => { void handleExport('pdf') } }
    ],
    // handleExport closes over period/platform; recompute when those change
    // so the menu always exports the visible filter combo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, platform]
  )

  usePanelToolbar({
    title: 'Dashboard',
    subtitle: 'Community analytics overview',
    inspector: { enabled: false },
    actions: (
      <>
        <Tooltip label="Sync now" shortcut={['⌥', '⌘', 'S']} side="bottom">
          <Button
            variant="icon"
            size="sm"
            onClick={() => { void syncNow() }}
            isLoading={loading}
            aria-label="Sync now"
          >
            <ArrowClockwise size={14} weight="bold" />
          </Button>
        </Tooltip>
        <SegmentedControl
          size="sm"
          ariaLabel="Time period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(v) => setPeriod(v)}
        />
        <SegmentedControl
          size="sm"
          ariaLabel="Platform"
          options={PLATFORM_OPTIONS}
          value={platform}
          onChange={(v) => setPlatform(v)}
        />
        <DropdownMenu
          align="end"
          trigger={
            <Button
              size="sm"
              leading={<Download size={13} weight="bold" />}
              trailing={<CaretDown size={11} weight="bold" />}
            >
              Export
            </Button>
          }
          items={exportItems}
        />
      </>
    )
  })

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Dashboard" subtitle="Community analytics overview" />

      {exportError && (
        <div style={ERROR_BANNER} role="alert">
          <WarningCircle size={14} weight="fill" />
          <span>Export failed: {exportError}</span>
        </div>
      )}

      {!data && loading && !error && <DashboardSkeleton />}

      {!data && error && (
        <EmptyState
          variant="error"
          icon={<WarningCircle size={40} weight="regular" />}
          title="Failed to load analytics"
          subtitle={error}
          action={
            <Button variant="primary" onClick={() => { void fetchStats() }}>
              Retry
            </Button>
          }
        />
      )}

      {data && (
        <>
          <StatsCards stats={data.stats} />

          <GrowthChart data={data.growth} platform={platform} />

          <div style={SPLIT_GRID}>
            <ActivityHeatmap data={data.heatmap} />
            <TopContributors data={data.contributors} />
          </div>
        </>
      )}
    </div>
  )
}
