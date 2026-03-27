# Database Schema

**Engine:** better-sqlite3 (synchronous, local)
**Location:** `~/.community-hub/data.db`
**Migrations:** Sequential numbered files, tracked in `_migrations` table

## Migration Strategy

```
src/main/migrations/
  ├── 001_initial.sql        # core tables
  ├── 002_agent_tables.sql   # AI agent tables
  └── ...
```

On startup, database service:
1. Creates `_migrations` table if not exists
2. Reads applied migrations
3. Runs pending migrations in order
4. Logs results

## Tables

### Core Platform Tables

**api_credentials** — encrypted API tokens
```sql
CREATE TABLE api_credentials (
  id INTEGER PRIMARY KEY,
  platform TEXT UNIQUE NOT NULL,
  token TEXT NOT NULL,
  secret TEXT,
  user_id TEXT,
  encrypted BOOLEAN DEFAULT TRUE,
  last_verified DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**platform_stats** — collected analytics
```sql
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  timestamp DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Scheduler Tables

**scheduled_posts** — post queue
```sql
CREATE TABLE scheduled_posts (
  id INTEGER PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  platforms TEXT NOT NULL,
  media_paths TEXT,
  scheduled_time DATETIME,
  sent_time DATETIME,
  status TEXT NOT NULL DEFAULT 'draft',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**post_history** — per-platform send results
```sql
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
```

### Community Tables

**community_members** — synced member list
```sql
CREATE TABLE community_members (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  join_date DATETIME,
  status TEXT DEFAULT 'active',
  reputation_score INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  notes TEXT,
  last_activity DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**member_warnings** — warning records
```sql
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
```

**member_actions** — ban/unban/mute log
```sql
CREATE TABLE member_actions (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT,
  executed_by TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(member_id) REFERENCES community_members(id) ON DELETE CASCADE
);
```

### Event Tables

**events** — community events
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  event_time TIME,
  location TEXT,
  platform TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**event_rsvps** — attendance tracking
```sql
CREATE TABLE event_rsvps (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  platform TEXT NOT NULL,
  response TEXT NOT NULL,
  responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

**event_reminders** — scheduled reminders
```sql
CREATE TABLE event_reminders (
  id INTEGER PRIMARY KEY,
  event_id INTEGER NOT NULL,
  reminder_time DATETIME NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at DATETIME,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### Report Tables

**generated_reports** — persisted report data
```sql
CREATE TABLE generated_reports (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  metrics TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Settings Table

**app_settings** — general preferences
```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### AI Agent Tables

See [ai-agent.md](ai-agent.md) for agent-specific tables:
- `agent_profile`
- `agent_patterns`
- `agent_automations`
- `agent_actions`

## Indexes

```sql
CREATE INDEX idx_stats_platform ON platform_stats(platform, timestamp);
CREATE INDEX idx_posts_status ON scheduled_posts(status, scheduled_time);
CREATE INDEX idx_members_platform ON community_members(platform, status);
CREATE INDEX idx_events_date ON events(event_date, status);
CREATE INDEX idx_agent_actions_status ON agent_actions(status, created_at);
```

## Total: 16 tables

Core: 3 (credentials, stats, settings)
Scheduler: 2 (posts, history)
Community: 3 (members, warnings, actions)
Events: 3 (events, rsvps, reminders)
Reports: 1 (generated_reports)
Agent: 4 (profile, patterns, automations, actions)
