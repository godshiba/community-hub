-- Spam protection configuration (JSON blob in app_settings)
-- Individual spam rules
CREATE TABLE IF NOT EXISTS spam_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL DEFAULT 'all',
  rule_type TEXT NOT NULL,
  threshold INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 10,
  action TEXT NOT NULL DEFAULT 'mute',
  mute_duration_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Spam detection event log
CREATE TABLE IF NOT EXISTS spam_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  message_content TEXT,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Raid event log
CREATE TABLE IF NOT EXISTS raid_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'suspected',
  join_count INTEGER NOT NULL DEFAULT 0,
  window_seconds INTEGER NOT NULL DEFAULT 30,
  actions_taken TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- Spam config stored as JSON in a simple key-value table
CREATE TABLE IF NOT EXISTS spam_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default config rows
INSERT OR IGNORE INTO spam_config (key, value) VALUES ('flood', '{"enabled":true,"messageRateLimit":5,"messageRateWindowSeconds":10,"duplicateSimilarityThreshold":80,"maxLinksPerMessage":3,"maxMentionsPerMessage":5,"maxEmojiPerMessage":15,"maxCapsPercent":70,"defaultAction":"mute","defaultMuteDurationMinutes":10}');
INSERT OR IGNORE INTO spam_config (key, value) VALUES ('raid', '{"enabled":true,"joinThreshold":10,"joinWindowSeconds":30,"minAccountAgeDays":7,"autoSlowmode":true,"autoLockdown":false,"autoBanNewAccounts":false,"notifyOwner":true}');

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_spam_events_platform ON spam_events(platform, detected_at);
CREATE INDEX IF NOT EXISTS idx_spam_events_user ON spam_events(user_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_raid_events_platform ON raid_events(platform, started_at);
CREATE INDEX IF NOT EXISTS idx_spam_rules_type ON spam_rules(rule_type);
