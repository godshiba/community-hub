import { useState, useEffect, memo } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useModerationStore } from '@/stores/moderation.store'
import { useRolesStore } from '@/stores/roles.store'
import type { AuditLogEntry, AuditActionType, RoleAssignment } from '@shared/moderation-types'

const AUDIT_ACTION_COLORS: Record<AuditActionType, string> = {
  warn: 'text-yellow-400',
  mute: 'text-blue-400',
  kick: 'text-orange-400',
  ban: 'text-red-500',
  unban: 'text-green-400',
  note: 'text-text-secondary',
  spam_detection: 'text-purple-400',
  raid_action: 'text-red-400'
}

interface MemberDetailPanelProps {
  onWarn: (id: number) => void
  onBan: (id: number) => void
}

export const MemberDetailPanel = memo(function MemberDetailPanel({ onWarn, onBan }: MemberDetailPanelProps): React.ReactElement | null {
  const { selectedMember, detailLoading, clearDetail, unbanMember, updateNotes } = useModerationStore()
  const { assignments, fetchAssignments, fetchPlatformRoles, platformRoles, assignRole, removeRole } = useRolesStore()
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [auditEntries, setAuditEntries] = useState<readonly AuditLogEntry[]>([])
  const [showRoleAssign, setShowRoleAssign] = useState(false)

  useEffect(() => {
    if (!selectedMember) { setAuditEntries([]); return }
    window.api.invoke('moderation:getMemberAuditLog', {
      memberId: selectedMember.member.id
    }).then((result) => {
      if (result.success) setAuditEntries(result.data)
    }).catch(() => {})
    fetchAssignments(selectedMember.member.id)
  }, [selectedMember?.member.id])

  const memberAssignments = assignments.filter((a) => !a.expired)

  if (detailLoading) {
    return (
      <GlassCard className="p-4 h-full flex items-center justify-center">
        <span className="text-xs text-text-muted">Loading...</span>
      </GlassCard>
    )
  }

  if (!selectedMember) return null

  const { member, warnings, actions } = selectedMember

  function startEditNotes(): void {
    setNotesValue(member.notes ?? '')
    setEditingNotes(true)
  }

  async function saveNotes(): Promise<void> {
    await updateNotes(member.id, notesValue)
    setEditingNotes(false)
  }

  return (
    <GlassCard className="p-4 h-full overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{member.username}</h3>
          <p className="text-xs text-text-muted capitalize">{member.platform} - {member.platformUserId}</p>
        </div>
        <button
          onClick={clearDetail}
          className="text-text-muted hover:text-text-secondary text-xs"
        >
          Close
        </button>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Status</span>
          <p className="text-text-primary capitalize">{member.status}</p>
        </div>
        <div>
          <span className="text-text-muted">Reputation</span>
          <p className="text-text-primary">{member.reputationScore}</p>
        </div>
        <div>
          <span className="text-text-muted">Warnings</span>
          <p className="text-text-primary">{member.warningsCount}</p>
        </div>
        <div>
          <span className="text-text-muted">Joined</span>
          <p className="text-text-primary">{member.joinDate ?? 'Unknown'}</p>
        </div>
        <div className="col-span-2">
          <span className="text-text-muted">Last Activity</span>
          <p className="text-text-primary">{member.lastActivity ?? 'Unknown'}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {member.status !== 'banned' ? (
          <>
            <button
              onClick={() => onWarn(member.id)}
              className="px-2 py-1 text-xs text-yellow-400 bg-yellow-400/10 rounded hover:bg-yellow-400/20 transition-colors"
            >
              Warn
            </button>
            <button
              onClick={() => onBan(member.id)}
              className="px-2 py-1 text-xs text-red-400 bg-red-400/10 rounded hover:bg-red-400/20 transition-colors"
            >
              Ban
            </button>
          </>
        ) : (
          <button
            onClick={() => unbanMember(member.id)}
            className="px-2 py-1 text-xs text-green-400 bg-green-400/10 rounded hover:bg-green-400/20 transition-colors"
          >
            Unban
          </button>
        )}
      </div>

      {/* Roles */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted font-medium">Roles ({memberAssignments.length})</span>
          <button
            onClick={() => {
              setShowRoleAssign(!showRoleAssign)
              if (!showRoleAssign) fetchPlatformRoles(member.platform)
            }}
            className="text-xs text-accent hover:text-accent/80 transition-colors"
          >
            {showRoleAssign ? 'Close' : 'Assign'}
          </button>
        </div>

        {memberAssignments.length > 0 && (
          <div className="space-y-1 mb-2">
            {memberAssignments.map((a: RoleAssignment) => (
              <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 bg-glass-surface rounded text-xs">
                <span className="text-text-primary">{a.roleName}</span>
                {a.expiresAt && (
                  <span className="text-text-muted text-[10px]">
                    expires {new Date(a.expiresAt + 'Z').toLocaleString()}
                  </span>
                )}
                <button
                  onClick={() => {
                    removeRole(a.id).then(() => fetchAssignments(member.id)).catch(() => {})
                  }}
                  className="ml-auto text-red-400 hover:bg-red-400/10 px-1 rounded transition-colors"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {showRoleAssign && (
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto mb-2">
            {platformRoles.length === 0 ? (
              <p className="text-xs text-text-muted">Connect platform to see roles</p>
            ) : (
              platformRoles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    assignRole(member.id, r.id, r.name, null).then(() => setShowRoleAssign(false)).catch(() => {})
                  }}
                  className="px-2 py-0.5 text-xs bg-glass-surface text-text-secondary border border-glass-border rounded hover:border-accent/30 transition-colors"
                >
                  {r.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted font-medium">Notes</span>
          {!editingNotes && (
            <button
              onClick={startEditNotes}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-1">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary resize-none"
              rows={3}
            />
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => setEditingNotes(false)}
                className="px-2 py-0.5 text-xs text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                className="px-2 py-0.5 text-xs text-accent bg-accent/10 rounded hover:bg-accent/20"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">{member.notes || 'No notes'}</p>
        )}
      </div>

      {/* Warnings */}
      <div>
        <h4 className="text-xs text-text-muted font-medium mb-1">Warnings ({warnings.length})</h4>
        {warnings.length === 0 ? (
          <p className="text-xs text-text-muted">No warnings</p>
        ) : (
          <div className="space-y-1">
            {warnings.map((w) => (
              <div key={w.id} className="px-2 py-1.5 bg-glass-surface rounded text-xs">
                <p className="text-text-primary">{w.reason}</p>
                <p className="text-text-muted mt-0.5">
                  {w.givenBy && `by ${w.givenBy} - `}{new Date(w.givenAt).toLocaleDateString()}
                  {w.resolved && ' (resolved)'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit history */}
      <div>
        <h4 className="text-xs text-text-muted font-medium mb-1">Audit History ({auditEntries.length})</h4>
        {auditEntries.length === 0 ? (
          <p className="text-xs text-text-muted">No audit entries</p>
        ) : (
          <div className="space-y-1">
            {auditEntries.map((e) => (
              <div key={e.id} className="px-2 py-1.5 bg-glass-surface rounded text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`font-medium ${AUDIT_ACTION_COLORS[e.actionType] ?? 'text-text-primary'}`}>
                    {e.actionType}
                  </span>
                  <span className="text-text-muted">by {e.moderator}</span>
                </div>
                {e.reason && <p className="text-text-secondary mt-0.5">{e.reason}</p>}
                <p className="text-text-muted mt-0.5">{new Date(e.timestamp + 'Z').toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  )
})
