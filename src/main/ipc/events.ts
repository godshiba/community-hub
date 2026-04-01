import { registerHandler } from './register-handler'
import { getPlatformManager } from '../services/platform-manager'
import * as repo from '../services/events.repository'
import type { Platform } from '@shared/settings-types'

export function registerEventHandlers(): void {
  registerHandler('events:create', async (payload) => {
    const event = repo.createEvent(payload)

    if (payload.announce) {
      await announceEvent(event.title, event.eventDate, payload.channelIds)
    }

    return event
  })

  registerHandler('events:getAll', (filter) => {
    return repo.getEvents(filter)
  })

  registerHandler('events:getDetail', (payload) => {
    return repo.getEventDetail(payload.id)
  })

  registerHandler('events:updateEvent', (payload) => {
    const { id, ...rest } = payload
    return repo.updateEvent(id, rest)
  })

  registerHandler('events:deleteEvent', (payload) => {
    repo.deleteEvent(payload.id)
  })

  registerHandler('events:getRSVPs', (payload) => {
    return repo.getRSVPs(payload.eventId)
  })

  registerHandler('events:exportAttendees', (payload) => {
    return repo.exportAttendees(payload.eventId)
  })
}

async function announceEvent(
  title: string,
  eventDate: string,
  channelIds: Record<Platform, string>
): Promise<void> {
  const mgr = getPlatformManager()
  const date = new Date(eventDate)
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const message = `New Event: ${title}\nDate: ${formatted}`

  const platforms: Platform[] = ['discord', 'telegram']
  for (const platform of platforms) {
    const channelId = channelIds[platform]
    if (!channelId) continue

    const service = platform === 'discord' ? mgr.discord : mgr.telegram
    if (service.status !== 'connected') continue

    try {
      await service.sendMessage(channelId, message)
    } catch {
      // Non-fatal: announcement failure should not block event creation
    }
  }
}
