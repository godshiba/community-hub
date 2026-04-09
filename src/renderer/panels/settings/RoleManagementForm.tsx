import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/glass/GlassCard'
import { useRolesStore } from '@/stores/roles.store'
import type { RoleRulePayload, PlatformRole, RoleRuleType } from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

export function RoleManagementForm(): React.ReactElement {
  const { rules, assignments, loading, fetchRules, saveRule, deleteRule, toggleRule, fetchPlatformRoles, platformRoles, fetchAssignments } = useRolesStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editPlatform, setEditPlatform] = useState<Platform>('discord')
  const [editRuleType, setEditRuleType] = useState<RoleRuleType>('auto_assign')
  const [editRoleId, setEditRoleId] = useState('')
  const [editRoleName, setEditRoleName] = useState('')
  const [editDuration, setEditDuration] = useState('')

  useEffect(() => { fetchRules(); fetchAssignments() }, [])

  useEffect(() => {
    if (showAdd) fetchPlatformRoles(editPlatform)
  }, [editPlatform, showAdd])

  function handleSelectRole(role: PlatformRole): void {
    setEditRoleId(role.id)
    setEditRoleName(role.name)
  }

  async function handleSave(): Promise<void> {
    if (!editRoleId || !editRoleName) return

    const payload: RoleRulePayload = {
      platform: editPlatform,
      ruleType: editRuleType,
      roleId: editRoleId,
      roleName: editRoleName,
      durationHours: editRuleType === 'temp_role' && editDuration ? Number(editDuration) : null,
      enabled: true
    }

    try {
      await saveRule(payload)
      resetForm()
    } catch { /* error in store */ }
  }

  function resetForm(): void {
    setShowAdd(false)
    setEditRoleId('')
    setEditRoleName('')
    setEditDuration('')
  }

  const activeAssignments = assignments.filter((a) => !a.expired)

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Role Management</h3>
          <p className="text-xs text-text-muted mt-0.5">Auto-assign roles on join, manage temp roles</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
        >
          {showAdd ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {/* Add rule form */}
      {showAdd && (
        <GlassCard className="p-3 space-y-2 bg-glass-surface/50">
          <div className="flex gap-2">
            <select
              value={editPlatform}
              onChange={(e) => setEditPlatform(e.target.value as Platform)}
              className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
            >
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
            </select>

            <select
              value={editRuleType}
              onChange={(e) => setEditRuleType(e.target.value as RoleRuleType)}
              className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
            >
              <option value="auto_assign">Auto-assign on Join</option>
              <option value="temp_role">Temp Role</option>
            </select>
          </div>

          {/* Role selection */}
          <div>
            <label className="text-xs text-text-muted block mb-1">Select Role</label>
            {platformRoles.length === 0 ? (
              <p className="text-xs text-text-muted">No roles available. Connect to the platform first.</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {platformRoles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      editRoleId === r.id
                        ? 'bg-accent/20 text-accent border border-accent/40'
                        : 'bg-glass-surface text-text-secondary border border-glass-border hover:border-accent/30'
                    }`}
                  >
                    {r.color && <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: r.color }} />}
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duration for temp roles */}
          {editRuleType === 'temp_role' && (
            <div>
              <label className="text-xs text-text-muted block mb-1">Duration (hours)</label>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 24"
                min="1"
                className="px-2 py-1 text-xs bg-glass-surface border border-glass-border rounded text-text-primary w-32"
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!editRoleId}
            className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            Save Rule
          </button>
        </GlassCard>
      )}

      {/* Rules list */}
      {loading ? (
        <p className="text-xs text-text-muted">Loading...</p>
      ) : rules.length === 0 ? (
        <p className="text-xs text-text-muted">No role rules configured.</p>
      ) : (
        <div className="space-y-1">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 px-2 py-1.5 bg-glass-surface rounded text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${rule.enabled ? 'bg-green-400' : 'bg-text-muted'}`} />
                <span className="text-text-primary font-medium truncate">{rule.roleName}</span>
                <span className="text-text-muted capitalize">{rule.platform}</span>
                <span className="text-text-muted">
                  {rule.ruleType === 'auto_assign' ? 'Auto-assign' : `Temp (${rule.durationHours}h)`}
                </span>
              </div>
              <button
                onClick={() => toggleRule(rule.id, !rule.enabled)}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  rule.enabled ? 'text-green-400 hover:bg-green-400/10' : 'text-text-muted hover:bg-white/5'
                }`}
              >
                {rule.enabled ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                className="px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-400/10 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active temp role assignments */}
      {activeAssignments.length > 0 && (
        <div>
          <h4 className="text-xs text-text-muted font-medium mb-1">Active Temp Roles ({activeAssignments.length})</h4>
          <div className="space-y-1">
            {activeAssignments.filter((a) => a.expiresAt).map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-2 py-1 bg-glass-surface rounded text-xs">
                <span className="text-text-primary">{a.memberUsername}</span>
                <span className="text-text-muted">{a.roleName}</span>
                <span className="text-text-muted ml-auto">
                  Expires: {a.expiresAt ? new Date(a.expiresAt + 'Z').toLocaleString() : 'Never'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
