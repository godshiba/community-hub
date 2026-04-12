-- Knowledge base tables: entries, categories, FTS5 index, channel agent configs

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  platform_scope TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 virtual table for full-text search on knowledge entries
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
  title,
  content,
  tags,
  content=knowledge_entries,
  content_rowid=id,
  tokenize='porter unicode61'
);

-- Triggers to keep FTS index in sync with knowledge_entries
CREATE TRIGGER IF NOT EXISTS knowledge_fts_insert AFTER INSERT ON knowledge_entries BEGIN
  INSERT INTO knowledge_fts(rowid, title, content, tags)
  VALUES (new.id, new.title, new.content, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_fts_delete AFTER DELETE ON knowledge_entries BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags)
  VALUES ('delete', old.id, old.title, old.content, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS knowledge_fts_update AFTER UPDATE ON knowledge_entries BEGIN
  INSERT INTO knowledge_fts(knowledge_fts, rowid, title, content, tags)
  VALUES ('delete', old.id, old.title, old.content, old.tags);
  INSERT INTO knowledge_fts(rowid, title, content, tags)
  VALUES (new.id, new.title, new.content, new.tags);
END;

-- Per-channel agent configuration
CREATE TABLE IF NOT EXISTS channel_agent_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  respond_mode TEXT NOT NULL DEFAULT 'mentioned',
  system_prompt_override TEXT,
  personality_override TEXT,
  knowledge_category_ids TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category ON knowledge_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_platform ON knowledge_entries(platform_scope);
CREATE INDEX IF NOT EXISTS idx_channel_configs_lookup ON channel_agent_configs(platform, channel_id);
