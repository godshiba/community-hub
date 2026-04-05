import type { RaidState, RaidConfig } from '@shared/spam-types'
import * as repo from './spam.repository'

// ---------------------------------------------------------------------------
// In-memory join tracking
// ---------------------------------------------------------------------------

interface JoinRecord {
  readonly userId: string
  readonly username: string
  readonly timestamp: number
  readonly accountCreated: number | null // epoch ms, null if unknown
}

interface PlatformRaidState {
  state: RaidState
  joins: JoinRecord[]
  activeRaidId: number | null
  cooldownTimer: ReturnType<typeof setTimeout> | null
  manualLockdown: boolean
}

const platformStates = new Map<string, PlatformRaidState>()

function getState(platform: string): PlatformRaidState {
  const existing = platformStates.get(platform)
  if (existing) return existing
  const state: PlatformRaidState = {
    state: 'normal',
    joins: [],
    activeRaidId: null,
    cooldownTimer: null,
    manualLockdown: false
  }
  platformStates.set(platform, state)
  return state
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RaidCheckResult {
  readonly stateChanged: boolean
  readonly previousState: RaidState
  readonly newState: RaidState
  readonly joinCount: number
  readonly suspiciousJoins: readonly JoinRecord[]
  readonly actions: readonly string[]
}

/** Record a new member join and evaluate raid heuristics */
export function recordJoin(
  platform: string,
  userId: string,
  username: string,
  accountCreated: number | null = null
): RaidCheckResult {
  const config = repo.getSpamConfig().raid
  if (!config.enabled) {
    return { stateChanged: false, previousState: 'normal', newState: 'normal', joinCount: 0, suspiciousJoins: [], actions: [] }
  }

  const pState = getState(platform)
  const now = Date.now()

  // Clean old joins outside window
  const cutoff = now - config.joinWindowSeconds * 1000
  pState.joins = pState.joins.filter((j) => j.timestamp > cutoff)

  // Add new join
  const join: JoinRecord = { userId, username, timestamp: now, accountCreated }
  pState.joins = [...pState.joins, join]

  const previousState = pState.state
  const suspicious = findSuspiciousJoins(pState.joins, config)
  const joinCount = pState.joins.length

  // Evaluate state transitions
  if (joinCount >= config.joinThreshold) {
    return transitionToActive(platform, pState, config, previousState, joinCount, suspicious)
  }

  if (joinCount >= Math.ceil(config.joinThreshold * 0.6)) {
    return transitionToSuspected(platform, pState, config, previousState, joinCount, suspicious)
  }

  return { stateChanged: false, previousState, newState: pState.state, joinCount, suspiciousJoins: suspicious, actions: [] }
}

/** Get current raid state for a platform */
export function getRaidState(platform?: string): RaidState {
  if (platform) {
    return getState(platform).state
  }
  // Return worst state across all platforms
  let worst: RaidState = 'normal'
  for (const [, pState] of platformStates) {
    if (pState.state === 'active' || pState.manualLockdown) return 'active'
    if (pState.state === 'suspected' && worst === 'normal') worst = 'suspected'
    if (pState.state === 'cooldown' && worst === 'normal') worst = 'cooldown'
  }
  return worst
}

/** Reset all in-memory state (for testing) */
export function resetRaidState(): void {
  for (const [, pState] of platformStates) {
    if (pState.cooldownTimer) clearTimeout(pState.cooldownTimer)
  }
  platformStates.clear()
}

/** Toggle manual lockdown mode */
export function setManualLockdown(enabled: boolean): void {
  for (const [platform] of platformStates) {
    const pState = getState(platform)
    pState.manualLockdown = enabled
    if (enabled) {
      pState.state = 'active'
    } else if (pState.state === 'active' && pState.joins.length < (repo.getSpamConfig().raid.joinThreshold)) {
      pState.state = 'normal'
    }
  }
  // Ensure at least one platform state exists for lockdown
  if (platformStates.size === 0 && enabled) {
    const pState = getState('all')
    pState.manualLockdown = true
    pState.state = 'active'
  }
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

function transitionToSuspected(
  platform: string,
  pState: PlatformRaidState,
  _config: RaidConfig,
  previousState: RaidState,
  joinCount: number,
  suspicious: readonly JoinRecord[]
): RaidCheckResult {
  if (pState.state === 'active') {
    return { stateChanged: false, previousState, newState: 'active', joinCount, suspiciousJoins: suspicious, actions: [] }
  }

  pState.state = 'suspected'
  return { stateChanged: previousState !== 'suspected', previousState, newState: 'suspected', joinCount, suspiciousJoins: suspicious, actions: ['Raid suspected — monitoring'] }
}

function transitionToActive(
  platform: string,
  pState: PlatformRaidState,
  config: RaidConfig,
  previousState: RaidState,
  joinCount: number,
  suspicious: readonly JoinRecord[]
): RaidCheckResult {
  const actions: string[] = []
  const wasActive = pState.state === 'active'

  pState.state = 'active'

  if (!wasActive) {
    // Log to database
    const actionsList: string[] = []
    if (config.autoSlowmode) actionsList.push('slowmode')
    if (config.autoLockdown) actionsList.push('lockdown')
    if (config.autoBanNewAccounts) actionsList.push('ban_new_accounts')
    if (config.notifyOwner) actionsList.push('notify_owner')

    const raidEvent = repo.logRaidEvent(
      platform, 'active', joinCount, config.joinWindowSeconds,
      actionsList.join(',')
    )
    pState.activeRaidId = raidEvent.id

    if (config.autoSlowmode) actions.push('slowmode')
    if (config.autoLockdown) actions.push('lockdown')
    if (config.autoBanNewAccounts) actions.push('ban_new_accounts')
    if (config.notifyOwner) actions.push('notify_owner')

    // Set cooldown timer (5 minutes after last join surge)
    if (pState.cooldownTimer) clearTimeout(pState.cooldownTimer)
    pState.cooldownTimer = setTimeout(() => {
      transitionToCooldown(platform, pState)
    }, 5 * 60 * 1000)
  }

  return {
    stateChanged: !wasActive,
    previousState,
    newState: 'active',
    joinCount,
    suspiciousJoins: suspicious,
    actions
  }
}

function transitionToCooldown(platform: string, pState: PlatformRaidState): void {
  if (pState.manualLockdown) return // Don't auto-resolve manual lockdown

  pState.state = 'cooldown'
  if (pState.activeRaidId) {
    repo.resolveRaidEvent(pState.activeRaidId)
    pState.activeRaidId = null
  }

  // Return to normal after 2 more minutes
  pState.cooldownTimer = setTimeout(() => {
    pState.state = 'normal'
    pState.joins = []
    pState.cooldownTimer = null
  }, 2 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// Suspicious join detection
// ---------------------------------------------------------------------------

function findSuspiciousJoins(joins: readonly JoinRecord[], config: RaidConfig): readonly JoinRecord[] {
  const now = Date.now()
  const minAgMs = config.minAccountAgeDays * 24 * 60 * 60 * 1000

  return joins.filter((j) => {
    // New account
    if (j.accountCreated !== null && (now - j.accountCreated) < minAgMs) return true
    // Similar username pattern (simple: check for sequential numbering)
    if (/\d{3,}$/.test(j.username)) return true
    return false
  })
}
