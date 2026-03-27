# Module Specifications

Each module owns one panel, one Zustand store, and one set of IPC channels.

---

## Dashboard

**Panel:** `panels/dashboard/DashboardPanel.tsx`
**Store:** `stores/analytics.store.ts`
**IPC prefix:** `analytics:`

**Responsibilities:**
- Display stats cards: total members, growth rate, active users, engagement rate
- Line chart: member growth over time
- Activity heatmap: hours x days
- Platform comparison: Discord vs Telegram bar chart
- Top contributors table
- Export to CSV / PDF
- Auto-refresh every 30 seconds
- Period selector: day, week, month, custom

**Sub-components:**
- `GrowthChart.tsx` — recharts line chart
- `ActivityHeatmap.tsx` — heatmap grid
- `PlatformComparison.tsx` — bar chart
- `TopContributors.tsx` — data table

---

## Agent Terminal

**Panel:** `panels/agent/AgentPanel.tsx`
**Store:** `stores/agent.store.ts`
**IPC prefix:** `agent:`

**Responsibilities:**
- Live feed of agent actions (reply, moderate, welcome, escalate)
- Pending approval queue
- Conversation thread viewer
- Pause/resume agent controls
- Action filtering (by type, platform, status)
- Correction interface (edit agent's response, saves as learning)

**Sub-components:**
- `ActionFeed.tsx` — scrolling action list
- `ApprovalQueue.tsx` — pending items
- `ConversationThread.tsx` — thread detail view
- `AgentControls.tsx` — pause/resume/status

---

## Scheduler

**Panel:** `panels/scheduler/SchedulerPanel.tsx`
**Store:** `stores/scheduler.store.ts`
**IPC prefix:** `scheduler:`

**Responsibilities:**
- Rich text editor for content (TipTap)
- Media upload (drag-drop)
- Platform toggles (Discord, Telegram)
- DateTime picker for scheduling
- Post queue (pending posts table)
- Post history (sent posts table)
- Edit drafts and scheduled posts
- Cancel scheduled posts
- Send now option
- AI: generate post, improve text (optional)

**Sub-components:**
- `PostEditor.tsx` — TipTap editor + media upload
- `PlatformSelector.tsx` — toggle checkboxes
- `PostQueue.tsx` — pending posts data table
- `PostHistory.tsx` — sent posts data table

---

## Moderation

**Panel:** `panels/moderation/ModerationPanel.tsx`
**Store:** `stores/moderation.store.ts`
**IPC prefix:** `moderation:`

**Responsibilities:**
- Member list with filters (platform, status, search)
- Sortable, paginated member table
- Member detail view (opens in secondary panel)
- Warning system: add, resolve, view history
- Ban/unban actions with reason
- Member notes
- Reputation score display
- Bulk actions (warn, ban selected)
- Export members to CSV
- AI: sentiment badges, member summary (optional)

**Sub-components:**
- `MemberTable.tsx` — data table with filters
- `MemberDetail.tsx` — detail view (secondary panel)
- `WarningForm.tsx` — add warning dialog
- `BanDialog.tsx` — ban confirmation

---

## Events

**Panel:** `panels/events/EventsPanel.tsx`
**Store:** `stores/events.store.ts`
**IPC prefix:** `events:`

**Responsibilities:**
- Event creation form (title, description, date, time, platform, capacity)
- Calendar view of upcoming events
- Event list with status filters
- Event detail view (secondary panel)
- RSVP tracking (yes/no/maybe counts + attendee list)
- Reminder configuration
- Export attendees to CSV
- AI: generate event description, attendance prediction (optional)

**Sub-components:**
- `EventForm.tsx` — create/edit form
- `EventCalendar.tsx` — calendar grid
- `EventList.tsx` — filterable list
- `EventDetail.tsx` — detail view (secondary panel)
- `RSVPList.tsx` — attendee table

---

## Reports

**Panel:** `panels/reports/ReportsPanel.tsx`
**Store:** `stores/reports.store.ts`
**IPC prefix:** `reports:`

**Responsibilities:**
- Report generator: period selector + metric checkboxes
- Report preview with charts and tables
- PDF export
- Report history list
- AI: narrative generation, smart recommendations, trend explanation (optional)

**Metrics:**
- Growth rate: `(current - previous) / previous * 100`
- Engagement rate: `active_users / total_users`
- Retention rate: `(end_users - new_users) / start_users`
- Churn rate: `1 - retention_rate`

**Sub-components:**
- `ReportGenerator.tsx` — config form
- `ReportPreview.tsx` — rendered report
- `ReportHistory.tsx` — previous reports list

---

## Settings

**Panel:** `panels/settings/SettingsPanel.tsx`
**IPC prefix:** `settings:`

**Responsibilities:**
- Platform credentials (Discord token, Telegram token)
- Test connection buttons
- AI provider configuration (provider, key, model, temperature)
- Agent profile editor (name, tone, knowledge, boundaries)
- Automation rules manager
- Pattern library editor
- App preferences (refresh intervals, panel layout persistence)

**Sub-components:**
- `CredentialsForm.tsx` — platform tokens
- `AiProviderForm.tsx` — AI configuration
- `AgentProfileEditor.tsx` — profile settings
- `AutomationRules.tsx` — rule list + editor
- `PatternLibrary.tsx` — pattern list + editor
