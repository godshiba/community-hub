# Prompt Templates for Community Management Hub

**Context:** You are developing a desktop application called "Community Management Hub" using Electron + React + TypeScript with local SQLite database. The app manages communities across Discord, Telegram, and Twitter.

---

## PHASE 1: PROJECT SETUP

### Prompt 1.1: Initialize Electron + React Project

```
Initialize a new Electron + React + TypeScript project for "Community Management Hub" with these requirements:

MUST HAVE:
1. Electron main process at src/main/index.ts
2. React app at src/renderer/App.tsx  
3. TypeScript in strict mode
4. Hot reload during development (npm start)
5. Build configuration for Windows/macOS/Linux
6. package.json with correct scripts

STRUCTURE:
- src/main/ (Electron main process)
- src/renderer/ (React components)
- src/shared/ (shared types)
- public/ (static assets)

DEPENDENCIES:
- electron, react, react-dom, typescript, better-sqlite3

OUTPUT: Complete, ready-to-run project structure with working npm start command.
```

---

### Prompt 1.2: Setup SQLite Database

```
Create SQLite database service for Community Management Hub.

REQUIREMENTS:
1. src/main/services/database.service.ts
2. Initialize database on app startup
3. Run all migrations automatically
4. Provide CRUD methods

MIGRATIONS to run (in order):
[Copy full SQL schema from SPEC.md tables section]

METHODS needed:
- init() - initialize database
- run(sql, params) - execute query
- get(sql, params) - get single row
- all(sql, params) - get all rows
- prepare(sql) - prepare statement

STORAGE LOCATION: ~/.community-hub/data.db

OUTPUT: Full database service that initializes on startup.
```

---

### Prompt 1.3: Setup Tailwind + shadcn/ui

```
Configure Tailwind CSS and shadcn/ui for Community Management Hub.

REQUIREMENTS:
1. Install and configure Tailwind CSS
2. Setup dark mode (class-based)
3. Install base shadcn/ui components:
   - Button
   - Input
   - Card
   - Dialog
   - Select
   - Tabs
   - Table
   - Badge
   - Alert

4. Create global styles file
5. Ensure dark mode works by default

OUTPUT: Working Tailwind + shadcn/ui setup with dark mode enabled.
```

---

### Prompt 1.4: Create Main Layout Components

```
Create layout components for Community Management Hub.

CREATE THESE FILES:

1. src/renderer/components/Sidebar.tsx:
   - Logo/brand at top
   - Navigation items with icons (lucide-react):
     * Dashboard
     * Scheduler  
     * Moderation
     * Events
     * Reports
     * Settings
   - Collapse/expand toggle
   - Active page indicator
   - Styled with Tailwind

2. src/renderer/components/TopNav.tsx:
   - App title on left
   - Theme toggle (dark/light) on right
   - User menu dropdown (settings, about, logout)
   - Notifications bell

3. src/renderer/App.tsx:
   - Layout wrapper combining Sidebar + TopNav
   - React Router setup
   - Route definitions for all pages

STYLING: Dark mode default, use Tailwind, responsive design

OUTPUT: Functional navigation system with routing.
```

---

### Prompt 1.5: Create Settings Page for API Credentials

```
Create Settings page for managing API credentials.

CREATE: src/renderer/pages/Settings.tsx

FORM FIELDS (with validation):
1. Discord Bot Token (masked input)
2. Telegram Bot Token (masked input)  
3. Twitter Bearer Token (masked input)

FEATURES:
- Input fields with password masking
- "Test Connection" button for each token
- Validate token format before save
- Encrypt tokens before storing (use Electron safeStorage)
- Show success/error messages
- Clear indication of saved state

IPC HANDLERS to create in src/main/ipc/settings.ts:
- ipcMain.handle('settings:saveCredentials', ...)
- ipcMain.handle('settings:loadCredentials', ...)
- ipcMain.handle('settings:testConnection', ...)

STYLING: Use shadcn/ui components, dark mode

OUTPUT: Working settings page that saves and encrypts credentials.
```

---

## PHASE 2: API INTEGRATION

### Prompt 2.1: Create Discord Service

```
Create Discord integration service.

CREATE: src/main/services/discord.service.ts

REQUIREMENTS:
- Use discord.js library
- Connect using bot token from credentials
- Implement these methods:

METHODS:
1. getGuildStats(guildId) - return { members, active_users, channels }
2. getMembers(guildId, limit=100) - return member array with username, user_id, join_date
3. getMemberInfo(guildId, userId) - return detailed member info
4. sendMessage(channelId, content, embeds?) - post message to channel
5. getMessageHistory(channelId, limit=50) - get recent messages
6. getUserActivity(guildId, period='7d') - return activity metrics

ERROR HANDLING:
- Graceful errors with meaningful messages
- Retry logic for failed requests
- Connection validation

CACHING:
- Cache stats for 30 seconds to avoid rate limits
- Invalidate cache on manual refresh

OUTPUT: Full Discord service with all methods working.
```

---

### Prompt 2.2: Create Telegram Service

```
Create Telegram integration service.

CREATE: src/main/services/telegram.service.ts

REQUIREMENTS:
- Use node-telegram-bot-api or telegram-bot-api
- Connect using bot token from credentials
- Implement these methods:

METHODS:
1. getChat(chatId) - return chat info { title, members, description }
2. getChatMembers(chatId) - return member array
3. sendMessage(chatId, text, parseMode='Markdown') - post message
4. sendMedia(chatId, type, file, caption) - send photo/video/document
5. getUpdates(chatId, limit=50) - get recent messages
6. getChatStats(chatId) - return activity metrics
7. getChatMemberCount(chatId) - return member count

POLLING SETUP:
- Setup polling for receiving updates
- Handle incoming messages
- Log all operations

ERROR HANDLING:
- Graceful error messages
- Retry on timeout
- Connection validation

OUTPUT: Full Telegram service with all methods working.
```

---

### Prompt 2.3: Create Twitter Service

```
Create Twitter integration service.

CREATE: src/main/services/twitter.service.ts

REQUIREMENTS:
- Use twitter-api-v2 library
- Authenticate using Bearer Token from credentials
- Implement these methods:

METHODS:
1. getProfile() - return user profile { username, followers, following, description }
2. getTweets(limit=100, period='7d') - return tweets array
3. getFollowers(limit=100) - return followers array
4. getMetrics() - return { followers, tweets, engagement_rate }
5. postTweet(text, media_ids=[], reply_to?) - post tweet
6. deleteTweet(tweetId) - delete tweet
7. getTweetMetrics(tweetId) - return { likes, retweets, replies, views }
8. searchHashtag(hashtag, limit=50) - search tweets with hashtag

RATE LIMITING:
- Implement rate limit handling
- Queue requests if needed
- Log rate limit status

ERROR HANDLING:
- Graceful error messages
- Validation of tweet length (280 chars)
- Handle media upload errors

OUTPUT: Full Twitter service with all methods working.
```

---

### Prompt 2.4: Create API Aggregator Service

```
Create service that aggregates data from all 3 platforms.

CREATE: src/main/services/aggregator.service.ts

METHODS:
1. getGlobalStats() - combines stats from Discord, Telegram, Twitter
   Return: { discord: {...}, telegram: {...}, twitter: {...} }

2. getAllMembers() - get members from all platforms
   Return: members array with platform field added

3. getGlobalActivity(period) - combined activity data

4. syncAllPlatforms() - trigger sync on all platforms in parallel

FEATURES:
- Run API calls in parallel for speed
- Fallback if one platform fails (don't break all)
- Caching with 30-second TTL
- Error recovery

IPC HANDLERS in src/main/ipc/analytics.ts:
- ipcMain.handle('analytics:getStats', ...)
- ipcMain.handle('analytics:syncNow', ...)

OUTPUT: Working aggregator that provides unified data from all platforms.
```

---

## PHASE 3: ANALYTICS DASHBOARD

### Prompt 3.1: Create Dashboard with Stats Cards

```
Create Analytics Dashboard page.

CREATE: src/renderer/pages/Dashboard.tsx

STRUCTURE:
1. Header:
   - Page title
   - Period selector (day, week, month, custom)
   - Last sync timestamp
   - Refresh button

2. Stats Grid (4 cards):
   - Total Members (number + change indicator ↑↓)
   - Growth Rate (% + trend)
   - Active Users (number + last 24h)
   - Engagement Rate (% + trend)

3. Charts area:
   - Member growth chart (line chart, recharts)
   - Activity heatmap (hours × days)
   - Platform comparison (bar chart)
   - Top contributors (table, top 5)

COMPONENT FILES needed:
- StatsCard.tsx - reusable stat card component
- GrowthChart.tsx - recharts line chart
- ActivityHeatmap.tsx - heatmap component
- PlatformComparison.tsx - bar chart
- TopContributors.tsx - table component

DATA FLOW:
- Fetch from ipc.invoke('analytics:getStats')
- Handle loading state with skeletons
- Handle error state with retry button
- Auto-refresh every 30 seconds

STYLING:
- Dark mode
- Responsive grid (1 col mobile, 2 tablet, 4 desktop)
- Smooth animations

OUTPUT: Fully functional analytics dashboard with all charts.
```

---

### Prompt 3.2: Add Export Functionality

```
Add CSV and PDF export to Dashboard.

REQUIREMENTS:
1. Export button in Dashboard header
2. Export CSV:
   - All stats data as rows
   - Include timestamp
   - Columns: metric, value, platform, timestamp

3. Export PDF:
   - Include header with date
   - Include all charts as images
   - Include stats summary
   - Professional formatting

LIBRARIES:
- For CSV: Use papaparse or manual CSV generation
- For PDF: Use pdf-lib or jsPDF with html2canvas

FEATURES:
- Loading indicator during generation
- Success notification
- File download
- Choose export format dialog

IPC HANDLER in src/main/ipc/analytics.ts:
- ipcMain.handle('analytics:exportStats', { format, data })

OUTPUT: Working export functionality for CSV and PDF.
```

---

### Prompt 3.3: Add Real-time Data Sync

```
Implement background data syncing for Dashboard.

REQUIREMENTS:
1. Background service that syncs stats every hour
2. Update dashboard in real-time (every 30 seconds)
3. Show data change indicators (↑ if grew, ↓ if declined)
4. Smooth animations when data updates
5. Pause/resume auto-refresh toggle

IMPLEMENTATION:
- useEffect hook with setInterval for polling
- Debounce API calls to avoid rate limits
- Cache results to reduce API load
- Smooth CSS transitions for number changes

API CALLS:
- Call ipc.invoke('analytics:getStats') every 30 seconds
- Show loading skeleton while fetching
- Update only changed values

FEATURES:
- Toggle auto-refresh on/off
- Manual refresh button
- Last sync timestamp display
- Connection status indicator

OUTPUT: Live updating dashboard with smooth animations.
```

---

## PHASE 4: MULTI-PLATFORM SCHEDULER

### Prompt 4.1: Create Scheduler Page

```
Create Multi-Platform Scheduler page.

CREATE: src/renderer/pages/Scheduler.tsx

STRUCTURE:
1. Create Post Form:
   - Rich text editor for content (use slate or draft-js)
   - Media uploader (drag-drop, click to upload)
   - Platform toggles (Discord ☑ Telegram ☑ Twitter ☑)
   - DateTime picker for scheduling
   - Preview button
   - Schedule button
   - Draft toggle

2. Queue Tab:
   - Table of pending posts
   - Columns: Content (preview), Platforms, Scheduled Time, Status, Actions
   - Edit button (for drafts/scheduled)
   - Delete button
   - Send Now button (for scheduled posts)

3. History Tab:
   - Sent posts
   - Columns: Content, Platforms, Sent Time, Status (success/failed)
   - Error details for failed posts

COMPONENTS:
- RichTextEditor.tsx - content editor
- MediaUploader.tsx - upload component
- PlatformSelector.tsx - checkboxes for platforms
- ScheduleDateTime.tsx - date/time picker
- PostPreview.tsx - preview modal
- PostQueue.tsx - pending posts table
- PostHistory.tsx - sent posts table

IPC HANDLERS in src/main/ipc/scheduler.ts:
- ipcMain.handle('scheduler:createPost', ...)
- ipcMain.handle('scheduler:getQueue', ...)
- ipcMain.handle('scheduler:editPost', ...)
- ipcMain.handle('scheduler:cancelPost', ...)
- ipcMain.handle('scheduler:sendNow', ...)

OUTPUT: Fully functional scheduler page.
```

---

## PHASE 5: MODERATION TOOLS

### Prompt 5.1: Create Moderation Page

```
Create Moderation Tools page.

CREATE: src/renderer/pages/Moderation.tsx

STRUCTURE:
1. Filters:
   - Platform dropdown (Discord, Telegram, Twitter, All)
   - Status dropdown (Active, Inactive, Banned, Warned)
   - Date range picker
   - Search by username

2. Members Table:
   - Columns: Username, Platform, Join Date, Status, Warnings, Reputation, Last Activity, Actions
   - Sortable columns
   - Pagination
   - Bulk select checkboxes

3. Member Detail Modal:
   - User info
   - Full warning history
   - All actions (bans, unbans, etc)
   - Add warning button
   - Ban/Unban button
   - Notes section
   - Reputation score

4. Bulk Actions:
   - Warn selected users
   - Ban selected users
   - Export selected to CSV

COMPONENTS:
- MemberTable.tsx - main table
- MemberFilters.tsx - filter controls
- MemberModal.tsx - detail view
- WarningForm.tsx - add warning dialog
- BanDialog.tsx - ban confirmation
- ReputationBadge.tsx - reputation display

IPC HANDLERS in src/main/ipc/moderation.ts:
- ipcMain.handle('moderation:getMembers', ...)
- ipcMain.handle('moderation:getMemberDetail', ...)
- ipcMain.handle('moderation:warnUser', ...)
- ipcMain.handle('moderation:banUser', ...)
- ipcMain.handle('moderation:unbanUser', ...)
- ipcMain.handle('moderation:exportMembers', ...)

DATABASE OPERATIONS:
- Auto-sync members from APIs
- Track all warnings and actions
- Calculate reputation scores
- Update member status

OUTPUT: Fully functional moderation system.
```

---

## PHASE 6: EVENTS & REPORTS

### Prompt 6.1: Create Events Manager

```
Create Event Manager page.

CREATE: src/renderer/pages/Events.tsx

STRUCTURE:
1. Event Creation Form:
   - Title, description, date, time, location
   - Platform selector (where to announce)
   - Capacity (optional)
   - Create button

2. Events Calendar View:
   - Calendar with upcoming events
   - Click event to view details

3. Events List:
   - All events with status
   - Filters (status, platform, date range)
   - Sortable columns

4. Event Detail Modal:
   - Full event info
   - RSVP stats (yes/no/maybe counts)
   - Attendees list
   - Send reminder button
   - Export attendees (CSV)
   - Edit button
   - Cancel event button

COMPONENTS:
- EventForm.tsx - create/edit event
- EventCalendar.tsx - calendar view
- EventList.tsx - list view
- EventDetail.tsx - detail modal
- RSVPList.tsx - attendees table
- ReminderSettings.tsx - reminder config

IPC HANDLERS in src/main/ipc/events.ts:
- ipcMain.handle('events:create', ...)
- ipcMain.handle('events:getAll', ...)
- ipcMain.handle('events:getDetail', ...)
- ipcMain.handle('events:updateEvent', ...)
- ipcMain.handle('events:deleteEvent', ...)
- ipcMain.handle('events:getRSVPs', ...)
- ipcMain.handle('events:exportAttendees', ...)

BACKGROUND:
- Auto-send reminders at scheduled times
- Sync RSVPs from all platforms

OUTPUT: Fully functional event manager.
```

---

### Prompt 6.2: Create Community Health Reports

```
Create Reports generator and viewer.

CREATE: src/renderer/pages/Reports.tsx

STRUCTURE:
1. Report Generator:
   - Period selector (week, month, quarter, custom)
   - Metric checkboxes:
     * Growth rate
     * Engagement rate
     * Member retention
     * Churn rate
     * Activity trends
   - Generate button

2. Report Preview:
   - Summary section (period, key metrics)
   - Growth analysis chart
   - Engagement analysis
   - Member health metrics
   - Top contributors
   - Recommendations section
   - Export to PDF button

3. Report History:
   - List of previous reports
   - Filter by date
   - Delete old reports

COMPONENTS:
- ReportGenerator.tsx - form
- ReportPreview.tsx - view
- ReportSummary.tsx - summary section
- GrowthAnalysis.tsx - growth charts
- Recommendations.tsx - insights

IPC HANDLERS in src/main/ipc/reports.ts:
- ipcMain.handle('reports:generate', ...)
- ipcMain.handle('reports:getHistory', ...)
- ipcMain.handle('reports:exportPDF', ...)
- ipcMain.handle('reports:deleteReport', ...)

CALCULATIONS:
- Growth rate: (current - previous) / previous * 100
- Engagement rate: active_users / total_users
- Retention rate: (end_users - new_users) / start_users
- Churn rate: 1 - retention_rate

RECOMMENDATIONS:
- Auto-generate based on trends
- Suggest optimal posting times
- Identify problem areas
- Suggest engagement improvements

OUTPUT: Full reporting system with PDF export.
```

---

## GENERAL GUIDELINES

### For Every Prompt:
1. Create all necessary files
2. Include full, working code (not pseudo-code)
3. Add TypeScript types for everything
4. Implement error handling and logging
5. Test functionality locally
6. Commit changes with descriptive message

### TypeScript:
- Use strict mode
- Type all function parameters and returns
- Create interfaces for data structures
- Use enums for fixed values (status, platforms, etc)

### Styling:
- Dark mode by default
- Use Tailwind CSS classes
- Use shadcn/ui components
- Ensure responsive design
- Test on mobile viewport

### Error Handling:
- All IPC handlers wrap in try-catch
- Log errors with timestamp
- Show user-friendly error messages
- Provide recovery options

### Database:
- All data persisted to SQLite
- Use transactions for multi-step operations
- Implement proper foreign keys
- Include timestamps on all records
