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
