import type { AgentProfile, AgentProfilePayload } from '@shared/agent-types'
import * as repo from './agent.repository'

export function getProfile(): AgentProfile | null {
  return repo.getProfile()
}

export function saveProfile(payload: AgentProfilePayload): AgentProfile {
  return repo.upsertProfile(payload)
}

/** Returns a default profile if none is configured yet */
export function getOrCreateDefault(): AgentProfile {
  const existing = repo.getProfile()
  if (existing) return existing

  return repo.upsertProfile({
    name: 'Community Bot',
    role: 'Community Manager',
    tone: 'friendly, professional',
    language: 'en'
  })
}
