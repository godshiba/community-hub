import { useState, type CSSProperties } from 'react'
import { WarningCircle, X } from '@phosphor-icons/react'
import { usePanelToolbar } from '@/hooks/usePanelToolbar'
import { useReportsStore } from '@/stores/reports.store'
import { SegmentedControl } from '@/components/ui-native/SegmentedControl'
import { HeroTitle } from '@/components/shell/HeroTitle'
import { ReportGenerator } from './ReportGenerator'
import { ReportHistory } from './ReportHistory'
import { ReportPreview } from './ReportPreview'

type Tab = 'generate' | 'history'

const TAB_OPTIONS = [
  { value: 'generate', label: 'Generate' },
  { value: 'history',  label: 'History'  }
] as const satisfies ReadonlyArray<{ value: Tab; label: string }>

const CONTAINER: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  paddingTop: 'var(--space-3)',
  height: '100%',
  minHeight: 0,
  maxWidth: 1400,
  width: '100%',
  marginInline: 'auto'
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

export function ReportsPanel(): React.ReactElement {
  const error      = useReportsStore((s) => s.error)
  const clearError = useReportsStore((s) => s.clearError)
  const generating = useReportsStore((s) => s.generating)
  const view       = useReportsStore((s) => s.view)
  const setView    = useReportsStore((s) => s.setView)

  // Map store view to tab; preview lives inside Generate tab as the main area.
  const tab: Tab = view === 'history' ? 'history' : 'generate'

  function handleTabChange(next: Tab): void {
    setView(next === 'history' ? 'history' : 'generator')
  }

  usePanelToolbar({
    title: 'Reports',
    inspector: {
      enabled: true,
      // Generate tab: inspector hosts the generator form.
      // History tab: inspector hosts the preview of the selected report.
      renderEmpty: () => (tab === 'generate' ? <ReportGenerator /> : <ReportPreview />)
    },
    actions: (
      <SegmentedControl
        size="sm"
        ariaLabel="Reports view"
        options={TAB_OPTIONS}
        value={tab}
        onChange={handleTabChange}
      />
    )
  })

  return (
    <div style={CONTAINER}>
      <HeroTitle title="Reports" />

      {error && (
        <div style={ERROR_BANNER} role="alert">
          <WarningCircle size={14} weight="fill" />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {tab === 'generate' ? <ReportPreview generating={generating} /> : <ReportHistory />}
    </div>
  )
}
