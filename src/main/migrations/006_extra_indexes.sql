-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_members_join_date ON community_members(join_date);
CREATE INDEX IF NOT EXISTS idx_agent_actions_platform ON agent_actions(platform, created_at);
