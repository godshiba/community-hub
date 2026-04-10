-- Content moderation policies
CREATE TABLE IF NOT EXISTS moderation_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Default Policy',
  enabled INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL DEFAULT 'all',
  classification_mode TEXT NOT NULL DEFAULT 'suspicious',
  test_mode INTEGER NOT NULL DEFAULT 1,
  categories TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content flags (flagged messages)
CREATE TABLE IF NOT EXISTS content_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT,
  message_content TEXT NOT NULL,
  classification TEXT NOT NULL,
  policy_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  action_executed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_flags_status ON content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_platform ON content_flags(platform);
CREATE INDEX IF NOT EXISTS idx_content_flags_created ON content_flags(created_at);
