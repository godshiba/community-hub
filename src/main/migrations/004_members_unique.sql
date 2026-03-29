CREATE UNIQUE INDEX IF NOT EXISTS idx_members_platform_user
  ON community_members(platform, platform_user_id);
