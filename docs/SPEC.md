# Community Management Hub - Agent Specification

## PROJECT DEFINITION
- **Name:** Community Management Hub
- **Type:** Desktop Application (Electron + React + TypeScript)
- **Platforms:** Windows, macOS, Linux
- **Database:** SQLite (local)
- **Target Users:** Community managers
- **Supported Platforms:** Discord, Telegram, Twitter

---

## DATABASE SCHEMA

### Tables to Create (Execute in order)

```sql
-- API Credentials Storage
CREATE TABLE api_credentials (
  id INTEGER PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  secret TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Data
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  timestamp DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Posts
CREATE TABLE scheduled_posts (
  id INTEGER PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  platforms TEXT NOT NULL, -- JSON array: ["discord","telegram","twitter"]
  media_paths TEXT, -- JSON array
  scheduled_time DATETIME,
  sent_time DATETIME,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, failed
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Post History
CREATE TABLE post_history (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  platform_message_id TEXT,
  success BOOLEAN,
  error_text TEXT,
  sent_at DATETIME,
  FOREIGN KEY(post_id) REFERENCES scheduled_posts(id) ON DELETE CASCADE
);

-- Community Members
CREATE TABLE community_members (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  join_date DATETIME,
  status TEXT DEFAULT 'active', -- active, inactive, banned, warned
  reputation_score INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  notes TEXT,
  last_activity DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Member Warnings
CREATE TABLE member_warnings (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  given_by TEXT,
  given_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  FOREIGN KEY(member_id) REFERENCES community_members(id) ON DELETE CASCADE
);

-- Member Actions Log
CREATE TABLE member_actions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- warn, ban, unban, mute, unmute
  reason TEXT,
  executed_by TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(member_id) REFERENCES community_members(id) ON DELETE CASCADE
);

-- Events
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  event_time TIME,
  location TEXT,
  platform TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'draft', -- draft, published, ongoing, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event RSVPs
CREATE TABLE event_rsvps (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  response TEXT NOT NULL, -- yes, no, maybe
  responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event Reminders
CREATE TABLE event_reminders (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL,
  reminder_time DATETIME NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at DATETIME,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

---

## FOLDER STRUCTURE

Create this exact structure:

```
src/
├── main/
│   ├── index.ts
│   ├── ipc/
│   │   ├── analytics.ts
│   │   ├── scheduler.ts
│   │   ├── moderation.ts
│   │   ├── events.ts
│   │   └── reports.ts
│   ├── services/
│   │   ├── discord.service.ts
│   │   ├── telegram.service.ts
│   │   ├── twitter.service.ts
│   │   └── database.service.ts
│   └── utils/
│       └── logger.ts
├── renderer/
│   ├── App.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Scheduler.tsx
│   │   ├── Moderation.tsx
│   │   ├── Events.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   └── [component-specific subdirs]
│   ├── hooks/
│   ├── store/
│   └── styles/
└── shared/
    └── types.ts
```

---

## DEPENDENCIES (package.json)

```json
{
  "name": "community-hub",
  "version": "0.1.0",
  "main": "public/electron.js",
  "homepage": "./",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "better-sqlite3": "^9.0.0",
    "discord.js": "^14.0.0",
    "telegram-bot-api": "^1.0.0",
    "twitter-api-v2": "^1.15.0",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.3.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "electron": "^26.0.0",
    "electron-builder": "^24.6.4",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

---

## MODULES SPECIFICATION

### Module 1: Analytics Dashboard
**Responsibility:** Collect and display statistics from all platforms

**IPC Methods:**
- `analytics:getStats(platform, period)` → Returns stats object
- `analytics:exportStats(format, data)` → Exports to CSV/PDF
- `analytics:syncNow()` → Force sync from APIs

**Frontend Page:** `Dashboard.tsx`
- Stats cards (members, growth, engagement, active users)
- Line charts (growth over time)
- Heatmap (activity by hour/day)
- Platform comparison chart
- Export button

---

### Module 2: Multi-Platform Scheduler
**Responsibility:** Post content to multiple platforms with scheduling

**IPC Methods:**
- `scheduler:createPost(content, platforms, scheduledTime)` → Returns post ID
- `scheduler:getQueue()` → Returns pending posts
- `scheduler:cancelPost(postId)` → Cancels scheduled post
- `scheduler:editPost(postId, newContent)` → Updates draft/scheduled post
- `scheduler:sendNow(postId)` → Sends immediately

**Frontend Page:** `Scheduler.tsx`
- Rich text editor
- Media uploader (drag-drop)
- Platform checkboxes (Discord, Telegram, Twitter)
- DateTime picker
- Queue table with status
- History tab

---

### Module 3: Moderation Tools
**Responsibility:** Manage community members and violations

**IPC Methods:**
- `moderation:getMembers(filters)` → Returns member list
- `moderation:getMemberDetail(memberId)` → Returns full member profile
- `moderation:warnUser(memberId, reason)` → Add warning
- `moderation:removeWarning(warningId)` → Remove warning
- `moderation:banUser(memberId, reason)` → Ban user
- `moderation:unbanUser(memberId)` → Unban user
- `moderation:exportMembers(format)` → CSV export

**Frontend Page:** `Moderation.tsx`
- Filters (platform, status, date range)
- Members table (username, status, warnings, reputation, last activity)
- Member detail modal
- Bulk actions (ban multiple)
- Member notes section

---

### Module 4: Event Manager
**Responsibility:** Create and manage community events

**IPC Methods:**
- `events:create(eventData)` → Create new event
- `events:getAll(filters)` → List events
- `events:getDetail(eventId)` → Event details + RSVPs
- `events:getRSVPs(eventId)` → List RSVPs
- `events:updateEvent(eventId, data)` → Update event
- `events:deleteEvent(eventId)` → Delete event
- `events:exportAttendees(eventId, format)` → Export CSV

**Frontend Page:** `Events.tsx`
- Event creation form
- Calendar view
- Event list
- RSVP modal (yes/no/maybe)
- Attendee list
- Reminder settings

---

### Module 5: Community Health Report
**Responsibility:** Generate insights and recommendations

**IPC Methods:**
- `reports:generate(period, metrics)` → Generate report data
- `reports:getHistory()` → List previous reports
- `reports:exportPDF(reportData)` → PDF export
- `reports:scheduleReport(frequency)` → Schedule auto-generation

**Frontend Page:** `Reports.tsx`
- Report generator (period picker, metric selector)
- Report preview
- PDF export button
- Report history list
- Schedule settings

---

## API INTEGRATION DETAILS

### Discord
- **Library:** discord.js
- **Auth:** Bot Token
- **Methods Needed:**
  - Get guild stats (member count, active users)
  - Get member list
  - Send message to channel
  - Get message history
  - React to messages

### Telegram
- **Library:** telegram-bot-api
- **Auth:** Bot Token
- **Methods Needed:**
  - Get chat info
  - Get chat member count
  - Send message
  - Send media
  - Get updates/messages

### Twitter
- **Library:** twitter-api-v2
- **Auth:** Bearer Token (+ API Key/Secret optional)
- **Methods Needed:**
  - Post tweet
  - Get tweets by user
  - Get follower count
  - Get engagement metrics
  - Get mentions

---

## IPC HANDLER STRUCTURE (Main Process)

```typescript
// All handlers follow this pattern:
ipcMain.handle('module:action', async (event, payload) => {
  try {
    const result = await performAction(payload);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Error in module:action', error);
    return { success: false, error: error.message };
  }
});
```

---

## BUILD & DEPLOYMENT

**Development:**
```bash
npm install
npm start
```

**Production Build:**
```bash
npm run build
npm run electron-build
```

**Output:**
- Windows: `.exe`
- macOS: `.dmg`
- Linux: `.AppImage`

---

## SECURITY REQUIREMENTS

1. **Encrypt API tokens** using Electron's `safeStorage`
2. **No credentials in logs** - sanitize before logging
3. **HTTPS only** for API calls
4. **SQLite encryption** optional but recommended
5. **No sensitive data in URLs**

---

## PERFORMANCE TARGETS

- **Startup time:** < 3 seconds
- **Stats load:** < 2 seconds
- **Post creation:** < 1 second
- **Export generation:** < 5 seconds
- **Memory usage:** < 500MB

---

## ERROR HANDLING STRATEGY

All errors must:
1. Log to file with timestamp and stack trace
2. Show user-friendly message in UI
3. Provide recovery option if possible
4. Never crash the app

---

## TESTING CHECKLIST

Each module must have:
- [ ] All IPC handlers tested
- [ ] Database operations tested
- [ ] API calls mocked/tested
- [ ] Error scenarios handled
- [ ] UI renders correctly
- [ ] Dark mode verified
- [ ] Responsive on mobile viewport

---

## VERSION CONTROL

**Tags:**
- v0.1.0 - Phase 1 (Setup & DB)
- v0.2.0 - Phase 2 (APIs)
- v0.3.0 - Phase 3 (Analytics)
- v0.4.0 - Phase 4 (Scheduler)
- v0.5.0 - Phase 5 (Moderation + Events)
- v1.0.0 - Release Ready

**Commit message format:**
```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: restructure code
perf: improve performance
```
