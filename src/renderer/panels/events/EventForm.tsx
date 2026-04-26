import { useState, useEffect } from 'react'
import { useEventsStore } from '@/stores/events.store'
import { Sheet } from '@/components/ui-native/Sheet'
import { TextField } from '@/components/ui-native/TextField'
import { TextArea } from '@/components/ui-native/TextArea'
import { Select } from '@/components/ui-native/Select'
import { NumberField } from '@/components/ui-native/NumberField'
import { Checkbox } from '@/components/ui-native/Checkbox'
import { Button } from '@/components/ui-native/Button'
import { FormRow } from '@/components/ui-native/FormRow'
import type { EventPayload, EventStatus, ReminderConfig, ReminderOffset } from '@shared/events-types'
import type { Platform } from '@shared/settings-types'

const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active',    label: 'Active'    },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const satisfies ReadonlyArray<{ value: EventStatus; label: string }>

const PLATFORM_OPTIONS = [
  { value: 'none',     label: 'None'     },
  { value: 'discord',  label: 'Discord'  },
  { value: 'telegram', label: 'Telegram' }
] as const

const REMINDER_OPTIONS: ReadonlyArray<{ value: ReminderOffset; label: string }> = [
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' }
]

export function EventForm(): React.ReactElement {
  const formOpen      = useEventsStore((s) => s.formOpen)
  const editingEvent  = useEventsStore((s) => s.editingEvent)
  const closeForm     = useEventsStore((s) => s.closeForm)
  const createEvent   = useEventsStore((s) => s.createEvent)
  const updateEvent   = useEventsStore((s) => s.updateEvent)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [platform, setPlatform] = useState<'none' | Platform>('none')
  const [capacity, setCapacity] = useState<number | null>(null)
  const [status, setStatus] = useState<EventStatus>('scheduled')
  const [announce, setAnnounce] = useState(false)
  const [reminders, setReminders] = useState<ReminderOffset[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setTitle(editingEvent?.title ?? '')
    setDescription(editingEvent?.description ?? '')
    setEventDate(editingEvent?.eventDate?.slice(0, 10) ?? '')
    setEventTime(editingEvent?.eventTime ?? '')
    setLocation(editingEvent?.location ?? '')
    setPlatform(editingEvent?.platform ?? 'none')
    setCapacity(editingEvent?.capacity ?? null)
    setStatus(editingEvent?.status ?? 'scheduled')
    setAnnounce(false)
    setReminders([])
  }, [editingEvent])

  function reset(): void {
    setTitle(''); setDescription(''); setEventDate(''); setEventTime('')
    setLocation(''); setPlatform('none'); setCapacity(null); setStatus('scheduled')
    setAnnounce(false); setReminders([])
  }

  function close(): void {
    reset()
    closeForm()
  }

  async function handleSubmit(): Promise<void> {
    if (!title.trim() || !eventDate) return
    setSubmitting(true)
    const payload: EventPayload = {
      title: title.trim(),
      description: description.trim() || null,
      eventDate: new Date(eventDate + (eventTime ? `T${eventTime}` : 'T00:00')).toISOString(),
      eventTime: eventTime || null,
      location: location.trim() || null,
      platform: platform === 'none' ? null : platform,
      capacity,
      status,
      announce,
      channelIds: { discord: '', telegram: '' },
      reminders: reminders.map<ReminderConfig>((offset) => ({ offset }))
    }
    try {
      if (editingEvent) await updateEvent(editingEvent.id, payload)
      else              await createEvent(payload)
      close()
    } catch {
      // surfaced via store
    } finally {
      setSubmitting(false)
    }
  }

  function toggleReminder(offset: ReminderOffset): void {
    setReminders((prev) => (prev.includes(offset) ? prev.filter((r) => r !== offset) : [...prev, offset]))
  }

  return (
    <Sheet
      open={formOpen}
      onOpenChange={(open) => { if (!open) close() }}
      title={editingEvent ? 'Edit event' : 'New event'}
      width="md"
      ariaLabel={editingEvent ? 'Edit event' : 'New event'}
      footer={
        <>
          <Button variant="plain" onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => { void handleSubmit() }}
            disabled={!title.trim() || !eventDate}
            isLoading={submitting}
          >
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormRow label="Title" required>
          <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" autoFocus />
        </FormRow>

        <FormRow label="Description" optional>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this event about?" minRows={3} />
        </FormRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Date" required>
            <TextField type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </FormRow>
          <FormRow label="Time" optional>
            <TextField type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
          </FormRow>
        </div>

        <FormRow label="Location" optional>
          <TextField value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where it happens" />
        </FormRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Platform">
            <Select value={platform} onChange={(v) => setPlatform(v as 'none' | Platform)} options={PLATFORM_OPTIONS} fullWidth />
          </FormRow>
          <FormRow label="Capacity" optional>
            <NumberField value={capacity ?? null} onChange={(v) => setCapacity(v)} min={1} placeholder="Unlimited" />
          </FormRow>
        </div>

        <FormRow label="Status">
          <Select value={status} onChange={(v) => setStatus(v as EventStatus)} options={STATUS_OPTIONS} fullWidth />
        </FormRow>

        <FormRow label="Reminders" optional>
          <div style={{ display: 'flex', gap: 8 }}>
            {REMINDER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={reminders.includes(opt.value) ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => toggleReminder(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </FormRow>

        {!editingEvent && (
          <FormRow>
            <Checkbox
              checked={announce}
              onChange={setAnnounce}
              label="Announce on platform when created"
            />
          </FormRow>
        )}
      </div>
    </Sheet>
  )
}
