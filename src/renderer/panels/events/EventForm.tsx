import { useState } from 'react'
import { GlassModal } from '@/components/glass/GlassModal'
import { useEventsStore } from '@/stores/events.store'
import type { EventPayload, EventStatus, ReminderConfig, ReminderOffset } from '@shared/events-types'
import type { Platform } from '@shared/settings-types'

const STATUS_OPTIONS: readonly EventStatus[] = ['draft', 'scheduled', 'active', 'completed', 'cancelled']
const REMINDER_OPTIONS: readonly { value: ReminderOffset; label: string }[] = [
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' }
]

export function EventForm(): React.ReactElement | null {
  const { formOpen, editingEvent, closeForm, createEvent, updateEvent } = useEventsStore()

  const [title, setTitle] = useState(editingEvent?.title ?? '')
  const [description, setDescription] = useState(editingEvent?.description ?? '')
  const [eventDate, setEventDate] = useState(editingEvent?.eventDate?.slice(0, 10) ?? '')
  const [eventTime, setEventTime] = useState(editingEvent?.eventTime ?? '')
  const [location, setLocation] = useState(editingEvent?.location ?? '')
  const [platform, setPlatform] = useState<Platform | ''>(editingEvent?.platform ?? '')
  const [capacity, setCapacity] = useState(editingEvent?.capacity?.toString() ?? '')
  const [status, setStatus] = useState<EventStatus>(editingEvent?.status ?? 'scheduled')
  const [announce, setAnnounce] = useState(false)
  const [reminders, setReminders] = useState<ReminderOffset[]>([])
  const [submitting, setSubmitting] = useState(false)

  function resetAndClose(): void {
    setTitle('')
    setDescription('')
    setEventDate('')
    setEventTime('')
    setLocation('')
    setPlatform('')
    setCapacity('')
    setStatus('scheduled')
    setAnnounce(false)
    setReminders([])
    closeForm()
  }

  async function handleSubmit(): Promise<void> {
    if (!title.trim() || !eventDate) return
    setSubmitting(true)

    const reminderConfigs: ReminderConfig[] = reminders.map((offset) => ({ offset }))
    const channelIds: Record<Platform, string> = { discord: '', telegram: '' }

    const payload: EventPayload = {
      title: title.trim(),
      description: description.trim() || null,
      eventDate: new Date(eventDate + (eventTime ? `T${eventTime}` : 'T00:00')).toISOString(),
      eventTime: eventTime || null,
      location: location.trim() || null,
      platform: platform || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      status,
      announce,
      channelIds,
      reminders: reminderConfigs
    }

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload)
      } else {
        await createEvent(payload)
      }
      resetAndClose()
    } catch { /* error handled in store */ }

    setSubmitting(false)
  }

  function toggleReminder(offset: ReminderOffset): void {
    setReminders((prev) =>
      prev.includes(offset)
        ? prev.filter((r) => r !== offset)
        : [...prev, offset]
    )
  }

  return (
    <GlassModal open={formOpen} onClose={resetAndClose} className="max-w-md">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {editingEvent ? 'Edit Event' : 'Create Event'}
      </h3>

      <div className="space-y-3">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted"
          autoFocus
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted resize-none"
          rows={3}
        />

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-muted block mb-1">Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Time</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
            />
          </div>
        </div>

        {/* Location */}
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className="w-full px-3 py-2 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted"
        />

        {/* Platform & Capacity */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-muted block mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform | '')}
              className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
            >
              <option value="">None</option>
              <option value="discord">Discord</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Unlimited"
              min={1}
              className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EventStatus)}
            className="w-full px-2 py-1.5 text-xs bg-glass-surface border border-glass-border rounded text-text-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Reminders */}
        <div>
          <label className="text-xs text-text-muted block mb-1">Reminders</label>
          <div className="flex gap-2">
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleReminder(opt.value)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  reminders.includes(opt.value)
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-glass-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announce */}
        {!editingEvent && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
              className="rounded border-glass-border"
            />
            <span className="text-xs text-text-secondary">Announce on platform when created</span>
          </label>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={resetAndClose}
          className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !eventDate || submitting}
          className="px-3 py-1.5 text-xs font-medium bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
        </button>
      </div>
    </GlassModal>
  )
}
