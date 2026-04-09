import type { Platform } from './settings-types'

export type MemberStatus = 'active' | 'warned' | 'banned' | 'left'

export interface CommunityMember {
  readonly id: number
  readonly username: string
  readonly platform: Platform
  readonly platformUserId: string
  readonly joinDate: string | null
  readonly status: MemberStatus
  readonly reputationScore: number
  readonly warningsCount: number
  readonly notes: string | null
  readonly lastActivity: string | null
  readonly createdAt: string
}

export interface MemberWarning {
  readonly id: number
  readonly memberId: number
  readonly reason: string
  readonly givenBy: string | null
  readonly givenAt: string
  readonly resolved: boolean
  readonly resolvedAt: string | null
}

export interface MemberAction {
  readonly id: number
  readonly memberId: number
  readonly actionType: string  // 'warn' | 'ban' | 'unban' | 'kick' | 'note'
  readonly reason: string | null
  readonly executedBy: string | null
  readonly executedAt: string
}

export interface MemberDetail {
  readonly member: CommunityMember
  readonly warnings: readonly MemberWarning[]
  readonly actions: readonly MemberAction[]
}

export interface MembersFilter {
  readonly platform?: Platform
  readonly status?: MemberStatus
  readonly search?: string
  readonly page?: number
  readonly pageSize?: number
  readonly sortBy?: 'username' | 'reputation_score' | 'warnings_count' | 'last_activity' | 'join_date'
  readonly sortDir?: 'asc' | 'desc'
}

export interface MembersPage {
  readonly members: readonly CommunityMember[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
}

export interface WarnPayload {
  readonly memberId: number
  readonly reason: string
}

export interface BanPayload {
  readonly memberId: number
  readonly reason: string
}

export interface NotePayload {
  readonly memberId: number
  readonly notes: string
}

export interface ExportResult {
  readonly csv: string
  readonly count: number
}

// ---------------------------------------------------------------------------
// Audit Log (Phase 2)
// ---------------------------------------------------------------------------

export type AuditActionType =
  | 'warn'
  | 'mute'
  | 'kick'
  | 'ban'
  | 'unban'
  | 'note'
  | 'spam_detection'
  | 'raid_action'

export interface AuditLogEntry {
  readonly id: number
  readonly timestamp: string
  readonly moderator: string
  readonly moderatorType: 'human' | 'ai_agent' | 'system'
  readonly targetMemberId: number | null
  readonly targetUsername: string
  readonly actionType: AuditActionType
  readonly reason: string | null
  readonly platform: Platform
  readonly metadata: string | null
}

export interface AuditFilter {
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly actionType?: AuditActionType
  readonly moderator?: string
  readonly targetUsername?: string
  readonly platform?: Platform
  readonly limit?: number
  readonly offset?: number
}

export interface AuditPage {
  readonly entries: readonly AuditLogEntry[]
  readonly total: number
}

export interface AuditExportResult {
  readonly csv: string
  readonly count: number
}

// ---------------------------------------------------------------------------
// Escalation Chains (Phase 2)
// ---------------------------------------------------------------------------

export type EscalationActionType = 'warning' | 'mute' | 'kick' | 'ban'

export interface EscalationStep {
  readonly warningNumber: number
  readonly action: EscalationActionType
  readonly durationMinutes: number | null
}

export interface EscalationChain {
  readonly id: number
  readonly name: string
  readonly platform: Platform | 'all'
  readonly steps: readonly EscalationStep[]
  readonly warningExpiryDays: number | null
  readonly enabled: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface EscalationChainPayload {
  readonly name: string
  readonly platform: Platform | 'all'
  readonly steps: readonly EscalationStep[]
  readonly warningExpiryDays: number | null
  readonly enabled: boolean
}

// ---------------------------------------------------------------------------
// Bulk Moderation (Phase 3)
// ---------------------------------------------------------------------------

export type BulkActionType = 'warn' | 'ban' | 'kick'

export interface BulkActionPayload {
  readonly memberIds: readonly number[]
  readonly reason: string
}

export interface BulkActionResult {
  readonly total: number
  readonly succeeded: number
  readonly failed: number
  readonly errors: readonly string[]
}

// ---------------------------------------------------------------------------
// Role Management (Phase 3)
// ---------------------------------------------------------------------------

export type RoleRuleType = 'auto_assign' | 'temp_role'

export interface RoleRule {
  readonly id: number
  readonly platform: Platform
  readonly ruleType: RoleRuleType
  readonly roleId: string
  readonly roleName: string
  readonly durationHours: number | null
  readonly enabled: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface RoleRulePayload {
  readonly platform: Platform
  readonly ruleType: RoleRuleType
  readonly roleId: string
  readonly roleName: string
  readonly durationHours: number | null
  readonly enabled: boolean
}

export interface RoleAssignment {
  readonly id: number
  readonly memberId: number
  readonly memberUsername: string
  readonly platform: Platform
  readonly roleId: string
  readonly roleName: string
  readonly assignedAt: string
  readonly expiresAt: string | null
  readonly expired: boolean
}

export interface PlatformRole {
  readonly id: string
  readonly name: string
  readonly color: string | null
  readonly position: number
}
