-- Phase 3: Role management tables

CREATE TABLE IF NOT EXISTS role_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL CHECK(platform IN ('discord', 'telegram')),
  rule_type TEXT NOT NULL CHECK(rule_type IN ('auto_assign', 'temp_role')),
  role_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  duration_hours INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES community_members(id),
  platform TEXT NOT NULL CHECK(platform IN ('discord', 'telegram')),
  role_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  expired INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_member ON role_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_expires ON role_assignments(expires_at) WHERE expired = 0 AND expires_at IS NOT NULL;
