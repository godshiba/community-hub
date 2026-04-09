import { useState, useEffect, memo } from 'react'
import { useModerationStore } from '@/stores/moderation.store'
import { GlassCard } from '@/components/glass/GlassCard'
import { SkeletonRow } from '@/components/Skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import type { MemberStatus } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

interface MemberTableProps {
  onWarn: (id: number) => void
  onBan: (id: number) => void
}

const statusColors: Record<MemberStatus, string> = {
  active: 'text-green-400',
  warned: 'text-yellow-400',
  banned: 'text-red-400',
  left: 'text-text-muted'
}

export const MemberTable = memo(function MemberTable({ onWarn, onBan }: MemberTableProps): React.ReactElement {
  const {
    members, total, page, pageSize, loading,
    platform, status, search,
    setPlatform, setStatus, setSearch, setPage,
    fetchMemberDetail, sortBy, sortDir, setSort,
    selectedIds, toggleSelect, selectAll, clearSelection
  } = useModerationStore()

  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function handleSort(col: typeof sortBy): void {
    if (sortBy === col) {
      setSort(col, sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(col, 'asc')
    }
  }

  function sortArrow(col: typeof sortBy): string {
    if (sortBy !== col) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <GlassCard className="p-3 space-y-3 h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search username..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted w-48"
        />

        <select
          value={platform ?? ''}
          onChange={(e) => setPlatform((e.target.value || undefined) as Platform | undefined)}
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
        >
          <option value="">All Platforms</option>
          <option value="discord">Discord</option>
          <option value="telegram">Telegram</option>
        </select>

        <select
          value={status ?? ''}
          onChange={(e) => setStatus((e.target.value || undefined) as MemberStatus | undefined)}
          className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="warned">Warned</option>
          <option value="banned">Banned</option>
          <option value="left">Left</option>
        </select>

        {selectedIds.size > 0 && (
          <span className="text-xs text-accent font-medium">{selectedIds.size} selected</span>
        )}
        <span className="text-xs text-text-muted ml-auto">{total} members</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted border-b border-glass-border">
              <th className="py-1.5 px-2 w-8">
                <input
                  type="checkbox"
                  checked={members.length > 0 && members.every((m) => selectedIds.has(m.id))}
                  onChange={() => {
                    if (members.every((m) => selectedIds.has(m.id))) { clearSelection() } else { selectAll() }
                  }}
                  className="accent-accent cursor-pointer"
                />
              </th>
              <th className="text-left py-1.5 px-2 cursor-pointer hover:text-text-secondary" onClick={() => handleSort('username')}>
                Username{sortArrow('username')}
              </th>
              <th className="text-left py-1.5 px-2">Platform</th>
              <th className="text-left py-1.5 px-2 cursor-pointer hover:text-text-secondary" onClick={() => handleSort('reputation_score')}>
                Rep{sortArrow('reputation_score')}
              </th>
              <th className="text-left py-1.5 px-2 cursor-pointer hover:text-text-secondary" onClick={() => handleSort('warnings_count')}>
                Warns{sortArrow('warnings_count')}
              </th>
              <th className="text-left py-1.5 px-2">Status</th>
              <th className="text-right py-1.5 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && members.length === 0 ? (
              <>{Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)}</>
            ) : members.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-muted">No members found. Click &quot;Sync Members&quot; to import from platforms.</td></tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b border-glass-border/50 hover:bg-white/5 cursor-pointer transition-colors ${selectedIds.has(m.id) ? 'bg-accent/5' : ''}`}
                  onClick={() => fetchMemberDetail(m.id)}
                >
                  <td className="py-1.5 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(m.id) }}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-accent cursor-pointer"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-text-primary font-medium">{m.username}</td>
                  <td className="py-1.5 px-2 text-text-secondary capitalize">{m.platform}</td>
                  <td className="py-1.5 px-2 text-text-secondary">{m.reputationScore}</td>
                  <td className="py-1.5 px-2 text-text-secondary">{m.warningsCount}</td>
                  <td className={`py-1.5 px-2 capitalize ${statusColors[m.status]}`}>{m.status}</td>
                  <td className="py-1.5 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.status !== 'banned' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onWarn(m.id) }}
                            className="px-1.5 py-0.5 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                            title="Warn"
                          >
                            Warn
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onBan(m.id) }}
                            className="px-1.5 py-0.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Ban"
                          >
                            Ban
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-2 py-0.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-text-muted">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-2 py-0.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </GlassCard>
  )
})
