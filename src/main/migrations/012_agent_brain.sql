-- Phase 5b: Agent Brain — user memory and conversation turns

CREATE TABLE IF NOT EXISTS user_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  first_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
  interaction_count INTEGER DEFAULT 0,
  primary_language TEXT,
  expertise_level TEXT,
  facts TEXT DEFAULT '[]',
  conversation_summary TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, platform_user_id)
);

CREATE TABLE IF NOT EXISTS conversation_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  intent TEXT,
  knowledge_entry_ids TEXT DEFAULT '[]',
  actions TEXT DEFAULT '[]',
  thought TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv_turns_user ON conversation_turns(platform, platform_user_id);
CREATE INDEX IF NOT EXISTS idx_conv_turns_time ON conversation_turns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_lookup ON user_memory(platform, platform_user_id);
