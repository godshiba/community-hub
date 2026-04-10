import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useContentModerationStore } from '@/stores/content-moderation.store'
import { Loader2, ShieldCheck, Check, X, Gavel } from 'lucide-react'
import type { ContentCategory, FlagStatus } from '@shared/content-moderation-types'

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  clean: 'Clean',
  toxic: 'Toxic',
  nsfw_text: 'NSFW',
  spam: 'Spam',
  scam: 'Scam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  self_harm: 'Self-Harm'
}

const CATEGORY_COLORS: Record<ContentCategory, string> = {
  clean: 'text-green-400',
  toxic: 'text-orange-400',
  nsfw_text: 'text-pink-400',
  spam: 'text-yellow-400',
  scam: 'text-red-400',
  harassment: 'text-orange-500',
  hate_speech: 'text-red-500',
  self_harm: 'text-purple-400'
}

const STATUS_LABELS: Record<FlagStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  dismissed: 'Dismissed',
  actioned: 'Actioned'
}

const STATUS_COLORS: Record<FlagStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
  actioned: 'bg-red-500/20 text-red-400'
}

export function ContentReviewQueue(): React.ReactElement {
  const { flags, flagsLoading, fetchFlags, reviewFlag, setFlagFilter } = useContentModerationStore()
  const [statusFilter, setStatusFilter] = useState<FlagStatus | ''>('')
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  useEffect(() => { fetchFlags() }, [])

  const handleStatusFilter = (status: FlagStatus | '') => {
    setStatusFilter(status)
    setFlagFilter({ status: status || undefined })
  }

  const handleReview = async (flagId: number, decision: 'approve' | 'dismiss' | 'action') => {
    setReviewingId(flagId)
    try {
      await reviewFlag(flagId, decision)
    } catch {
      // Error handled by store
    }
    setReviewingId(null)
  }

  if (flagsLoading && flags.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{flags.length} flags</span>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value as FlagStatus | '')}
            className="text-xs bg-glass-surface border border-glass rounded px-2 py-1 text-text-primary"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="dismissed">Dismissed</option>
            <option value="actioned">Actioned</option>
          </select>
        </div>
        <button
          onClick={() => fetchFlags()}
          className="text-xs text-accent hover:text-accent/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      {flags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <ShieldCheck className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">No flagged content</span>
          <span className="text-xs mt-1">AI-flagged messages will appear here for review</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-[calc(100vh-20rem)] overflow-y-auto">
          {flags.map((flag) => (
            <GlassCard key={flag.id} elevation="surface" className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-text-primary truncate">
                      {flag.username}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-surface border border-glass text-text-muted">
                      {flag.platform}
                    </span>
                    <span className={`text-[10px] font-medium ${CATEGORY_COLORS[flag.classification.primaryCategory]}`}>
                      {CATEGORY_LABELS[flag.classification.primaryCategory]}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {(flag.classification.confidence * 100).toFixed(0)}%
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[flag.status]}`}>
                      {STATUS_LABELS[flag.status]}
                    </span>
                  </div>

                  <p className="text-[11px] text-text-secondary mb-1 line-clamp-2">
                    {flag.messageContent}
                  </p>

                  {flag.classification.reasoning && (
                    <p className="text-[10px] text-text-muted italic">
                      {flag.classification.reasoning}
                    </p>
                  )}

                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {flag.classification.scores
                      .filter((s) => s.score > 0.1 && s.category !== 'clean')
                      .sort((a, b) => b.score - a.score)
                      .map((s) => (
                        <span
                          key={s.category}
                          className="text-[9px] px-1 py-0.5 rounded bg-glass-surface border border-glass text-text-muted"
                        >
                          {CATEGORY_LABELS[s.category]} {(s.score * 100).toFixed(0)}%
                        </span>
                      ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-text-muted">
                    {formatRelative(flag.createdAt)}
                  </span>
                  {flag.status === 'pending' && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleReview(flag.id, 'approve')}
                        disabled={reviewingId === flag.id}
                        className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        title="Approve (false positive)"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReview(flag.id, 'dismiss')}
                        disabled={reviewingId === flag.id}
                        className="p-1 rounded bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors disabled:opacity-50"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReview(flag.id, 'action')}
                        disabled={reviewingId === flag.id}
                        className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        title="Confirm & execute action"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso + 'Z').getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
