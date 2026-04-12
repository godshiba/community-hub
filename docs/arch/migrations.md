# Migrations Architecture

Sequential numbered SQL files in `src/main/migrations/`. Auto-run on startup by `database.service.ts`.

## File Table

| File | Purpose |
|------|---------|
| `001_initial.sql` | 16 tables: credentials, stats, posts, members, events, reports, agent |
| `002_analytics_index.sql` | Composite index on `platform_stats(metric_name, timestamp, platform)` |
| `003_tracked_chats.sql` | `tracked_chats` table for Telegram chat tracking |
| `004_members_unique.sql` | Unique constraint on `community_members(platform, platform_user_id)` |
| `005_agent_respond_mode.sql` | `respond_mode` column on `agent_profile` |
| `006_extra_indexes.sql` | Additional performance indexes |
| `007_spam_protection.sql` | Spam rules, events, raid tables |
| `008_audit_escalation.sql` | Audit log and escalation chains |
| `009_roles.sql` | Role rules and assignments |
| `010_content_moderation.sql` | Content moderation policies and flags |
| `011_knowledge_base.sql` | Knowledge entries + FTS5 index, categories, channel agent configs |

## How Migrations Work

`database.service.ts` handles everything:

1. On startup, creates `_migrations` tracking table if missing
2. Reads all `.sql` files from `src/main/migrations/`, sorted alphabetically
3. Skips files already in `_migrations` table
4. Executes each new file and records it in `_migrations`
5. Logs each applied migration to console

```
_migrations table:
  id          INTEGER PRIMARY KEY
  name        TEXT NOT NULL UNIQUE     -- filename (e.g., "003_tracked_chats.sql")
  applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

## Adding a New Migration

1. **Pick the next number**: look at existing files, increment (e.g., `006_*.sql`)
2. **Create file**: `src/main/migrations/006_description.sql`
3. **Write SQL**: use `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE` as needed
4. **Test**: run `npm run dev` — migration applies automatically on startup
5. **Update docs**: add entry to this file + update `docs/ARCHITECTURE.md` migrations section

## Rules

- **Never edit an existing migration** — create a new one to alter tables
- **Always use `IF NOT EXISTS`** for `CREATE TABLE` to be idempotent
- **Number prefix is the sort key** — files run in alphabetical order
- **One concern per migration** — don't mix unrelated schema changes
- **No data migrations mixed with schema** — separate DDL from DML when possible
- **SQLite limitations**: no `DROP COLUMN` before SQLite 3.35.0, use table recreation pattern instead

## Migration SQL Template

```sql
-- Brief description of what this migration does
CREATE TABLE IF NOT EXISTS new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- For ALTER TABLE:
-- ALTER TABLE existing_table ADD COLUMN new_col TEXT DEFAULT '';
```

## Path Resolution

- **Dev**: `process.cwd()/src/main/migrations/`
- **Packaged**: `__dirname/../migrations/` (relative to compiled main process)

## Change Map

| Operation | Files to touch |
|-----------|---------------|
| Add migration | Create numbered `.sql` file, update this doc + `docs/ARCHITECTURE.md` |
| Add table | Migration file + new repository in `src/main/services/` + types in `src/shared/` |
| Add column | Migration file + update repository queries + update shared types |
