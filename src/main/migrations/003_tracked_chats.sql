-- Telegram tracked chats survive bot restarts
CREATE TABLE IF NOT EXISTS tracked_chats (
  chat_id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'telegram',
  title TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
