import { getDatabase } from './database.service'
import { getPlatformManager } from './platform-manager'
import { logAuditEntry } from './audit.repository'
import * as modRepo from './moderation.repository'
import type {
  EscalationChain,
  EscalationStep,
  EscalationChainPayload,
  EscalationActionType
} from '@shared/moderation-types'
import type { Platform } from '@shared/settings-types'

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface ChainRow {
  id: number
  name: string
  platform: string
  warning_expiry_days: number | null
  enabled: number
  created_at: string
  updated_at: string
}

interface StepRow {
  id: number
  chain_id: number
  warning_number: number
  action: string
  duration_minutes: number | null
}

// ---------------------------------------------------------------------------
// Read chains
// ---------------------------------------------------------------------------

function rowToChain(row: ChainRow, steps: readonly EscalationStep[]): EscalationChain {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform as Platform | 'all',
    steps,
    warningExpiryDays: row.warning_expiry_days,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function getStepsForChain(chainId: number): readonly EscalationStep[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM escalation_steps WHERE chain_id = ? ORDER BY warning_number ASC'
  ).all(chainId) as StepRow[]

  return rows.map((r) => ({
    warningNumber: r.warning_number,
    action: r.action as EscalationActionType,
    durationMinutes: r.duration_minutes
  }))
}

export function getChains(): readonly EscalationChain[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM escalation_chains ORDER BY id ASC').all() as ChainRow[]
  return rows.map((r) => rowToChain(r, getStepsForChain(r.id)))
}

export function getChainById(id: number): EscalationChain | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM escalation_chains WHERE id = ?').get(id) as ChainRow | undefined
  if (!row) return undefined
  return rowToChain(row, getStepsForChain(row.id))
}

// ---------------------------------------------------------------------------
// Save / update chain
// ---------------------------------------------------------------------------

export function saveChain(payload: EscalationChainPayload & { id?: number }): EscalationChain {
  const db = getDatabase()

  if (payload.id) {
    db.prepare(`
      UPDATE escalation_chains
      SET name = ?, platform = ?, warning_expiry_days = ?, enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(payload.name, payload.platform, payload.warningExpiryDays, payload.enabled ? 1 : 0, payload.id)

    db.prepare('DELETE FROM escalation_steps WHERE chain_id = ?').run(payload.id)
    insertSteps(payload.id, payload.steps)
    return getChainById(payload.id)!
  }

  const result = db.prepare(`
    INSERT INTO escalation_chains (name, platform, warning_expiry_days, enabled)
    VALUES (?, ?, ?, ?)
  `).run(payload.name, payload.platform, payload.warningExpiryDays, payload.enabled ? 1 : 0)

  const chainId = Number(result.lastInsertRowid)
  insertSteps(chainId, payload.steps)
  return getChainById(chainId)!
}

function insertSteps(chainId: number, steps: readonly EscalationStep[]): void {
  const db = getDatabase()
  const stmt = db.prepare(
    'INSERT INTO escalation_steps (chain_id, warning_number, action, duration_minutes) VALUES (?, ?, ?, ?)'
  )
  for (const step of steps) {
    stmt.run(chainId, step.warningNumber, step.action, step.durationMinutes)
  }
}

export function deleteChain(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM escalation_chains WHERE id = ?').run(id)
}

export function toggleChain(id: number, enabled: boolean): void {
  const db = getDatabase()
  db.prepare(
    "UPDATE escalation_chains SET enabled = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(enabled ? 1 : 0, id)
}

// ---------------------------------------------------------------------------
// Check & execute escalation after a warning
// ---------------------------------------------------------------------------

export async function checkEscalation(memberId: number, platform: Platform): Promise<void> {
  const member = modRepo.getMemberById(memberId)
  if (!member) return

  const chains = getChains().filter(
    (c) => c.enabled && (c.platform === 'all' || c.platform === platform)
  )
  if (chains.length === 0) return

  // Use the first matching chain
  const chain = chains[0]
  const activeWarnings = getActiveWarningCount(memberId, chain.warningExpiryDays)

  // Find the step matching the current warning count
  const step = chain.steps.find((s) => s.warningNumber === activeWarnings)
  if (!step) return

  // 'warning' action = no additional escalation (the warn already happened)
  if (step.action === 'warning') return

  await executeEscalationAction(member.id, member.platformUserId, platform, member.username, step)
}

function getActiveWarningCount(memberId: number, expiryDays: number | null): number {
  const db = getDatabase()

  if (expiryDays != null) {
    const row = db.prepare(`
      SELECT COUNT(*) as cnt FROM member_warnings
      WHERE member_id = ? AND resolved = 0
        AND given_at >= datetime('now', '-' || ? || ' days')
    `).get(memberId, expiryDays) as { cnt: number }
    return row.cnt
  }

  const row = db.prepare(
    'SELECT COUNT(*) as cnt FROM member_warnings WHERE member_id = ? AND resolved = 0'
  ).get(memberId) as { cnt: number }
  return row.cnt
}

async function executeEscalationAction(
  memberId: number,
  platformUserId: string,
  platform: Platform,
  username: string,
  step: EscalationStep
): Promise<void> {
  const mgr = getPlatformManager()
  const service = platform === 'discord' ? mgr.discord : mgr.telegram
  if (service.status !== 'connected') return

  const reason = `Auto-escalation: warning #${step.warningNumber} -> ${step.action}`

  try {
    switch (step.action) {
      case 'mute':
        await service.muteUser(platformUserId, step.durationMinutes ?? 60)
        logAuditEntry({
          moderator: 'escalation-engine',
          moderatorType: 'system',
          targetMemberId: memberId,
          targetUsername: username,
          actionType: 'mute',
          reason,
          platform
        })
        break

      case 'kick':
        // Kick = ban + unban (no dedicated kick in platform interface)
        await service.banUser(platformUserId, reason)
        await service.unbanUser(platformUserId)
        modRepo.banMember(memberId, reason)
        modRepo.unbanMember(memberId)
        logAuditEntry({
          moderator: 'escalation-engine',
          moderatorType: 'system',
          targetMemberId: memberId,
          targetUsername: username,
          actionType: 'kick',
          reason,
          platform
        })
        break

      case 'ban':
        await service.banUser(platformUserId, reason)
        modRepo.banMember(memberId, reason)
        logAuditEntry({
          moderator: 'escalation-engine',
          moderatorType: 'system',
          targetMemberId: memberId,
          targetUsername: username,
          actionType: 'ban',
          reason,
          platform
        })
        break
    }
  } catch {
    // Non-fatal: escalation action failed on platform
  }
}
