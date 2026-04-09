-- Audit log for all moderation actions
CREATE TABLE IF NOT EXISTS moderation_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  moderator TEXT NOT NULL DEFAULT 'system',
  moderator_type TEXT NOT NULL DEFAULT 'system',
  target_member_id INTEGER,
  target_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT,
  platform TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (target_member_id) REFERENCES community_members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON moderation_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON moderation_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_target ON moderation_audit_log(target_member_id);
CREATE INDEX IF NOT EXISTS idx_audit_moderator ON moderation_audit_log(moderator);
CREATE INDEX IF NOT EXISTS idx_audit_platform ON moderation_audit_log(platform);

-- Escalation chains
CREATE TABLE IF NOT EXISTS escalation_chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'all',
  warning_expiry_days INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Escalation steps (one chain has many steps)
CREATE TABLE IF NOT EXISTS escalation_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL,
  warning_number INTEGER NOT NULL,
  action TEXT NOT NULL,
  duration_minutes INTEGER,
  FOREIGN KEY (chain_id) REFERENCES escalation_chains(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escalation_steps_chain ON escalation_steps(chain_id);

-- Insert default escalation chain
INSERT INTO escalation_chains (name, platform, warning_expiry_days, enabled)
VALUES ('Default', 'all', 30, 1);

INSERT INTO escalation_steps (chain_id, warning_number, action, duration_minutes)
VALUES
  (1, 1, 'warning', NULL),
  (1, 2, 'mute', 60),
  (1, 3, 'mute', 1440),
  (1, 4, 'kick', NULL),
  (1, 5, 'ban', NULL);
