CREATE TABLE IF NOT EXISTS brain_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  config_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO brain_config (id, config_json) VALUES (1, '{}');
