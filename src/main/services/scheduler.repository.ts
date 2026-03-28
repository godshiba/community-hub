import { getDatabase } from './database.service'
import type {
  ScheduledPost,
  PostPayload,
  PostHistoryEntry,
  PostStatus
} from '@shared/scheduler-types'

// ---------------------------------------------------------------------------
// Row ↔ Domain mapping
// ---------------------------------------------------------------------------

interface PostRow {
  id: number
  title: string | null
  content: string
  platforms: string   // JSON
  media_paths: string | null  // JSON
  scheduled_time: string | null
  sent_time: string | null
  status: string
  error_message: string | null
  created_at: string
  updated_at: string
}

interface HistoryRow {
  id: number
  post_id: number
  platform: string
  platform_message_id: string | null
  success: number  // SQLite boolean
  error_text: string | null
  sent_at: string | null
}

function rowToPost(row: PostRow): ScheduledPost {
  let channelIds: Record<string, string> = {}
  try {
    const parsed = JSON.parse(row.media_paths ?? '{}')
    // We repurpose media_paths column temporarily; proper column will come
    // if we add a migration. For now channelIds is stored as JSON in media_paths.
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      channelIds = parsed
    }
  } catch { /* ignore */ }

  return {
    id: row.id,
    title: row.title ?? '',
    content: row.content,
    platforms: JSON.parse(row.platforms),
    channelIds,
    scheduledTime: row.scheduled_time,
    sentTime: row.sent_time,
    status: row.status as PostStatus,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function rowToHistory(row: HistoryRow): PostHistoryEntry {
  return {
    id: row.id,
    postId: row.post_id,
    platform: row.platform as 'discord' | 'telegram',
    platformMessageId: row.platform_message_id,
    success: row.success === 1,
    errorText: row.error_text,
    sentAt: row.sent_at
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function createPost(payload: PostPayload): ScheduledPost {
  const db = getDatabase()
  const status: PostStatus = payload.scheduledTime ? 'scheduled' : 'draft'

  const result = db.prepare(`
    INSERT INTO scheduled_posts (title, content, platforms, media_paths, scheduled_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    payload.title,
    payload.content,
    JSON.stringify(payload.platforms),
    JSON.stringify(payload.channelIds),
    payload.scheduledTime,
    status
  )

  return getPost(Number(result.lastInsertRowid))!
}

export function updatePost(id: number, payload: PostPayload): ScheduledPost {
  const db = getDatabase()
  const status: PostStatus = payload.scheduledTime ? 'scheduled' : 'draft'

  db.prepare(`
    UPDATE scheduled_posts
    SET title = ?, content = ?, platforms = ?, media_paths = ?,
        scheduled_time = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND status IN ('draft', 'scheduled')
  `).run(
    payload.title,
    payload.content,
    JSON.stringify(payload.platforms),
    JSON.stringify(payload.channelIds),
    payload.scheduledTime,
    status,
    id
  )

  const post = getPost(id)
  if (!post) throw new Error(`Post ${id} not found`)
  return post
}

export function getPost(id: number): ScheduledPost | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM scheduled_posts WHERE id = ?').get(id) as PostRow | undefined
  return row ? rowToPost(row) : undefined
}

export function getQueue(): readonly ScheduledPost[] {
  const db = getDatabase()
  const rows = db.prepare(
    "SELECT * FROM scheduled_posts WHERE status IN ('draft', 'scheduled', 'sending') ORDER BY scheduled_time ASC, created_at DESC"
  ).all() as PostRow[]
  return rows.map(rowToPost)
}

export function getHistory(): readonly PostHistoryEntry[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM post_history ORDER BY sent_at DESC LIMIT 200'
  ).all() as HistoryRow[]
  return rows.map(rowToHistory)
}

export function cancelPost(id: number): void {
  const db = getDatabase()
  const result = db.prepare(
    "UPDATE scheduled_posts SET status = 'draft', scheduled_time = NULL, updated_at = datetime('now') WHERE id = ? AND status IN ('draft', 'scheduled')"
  ).run(id)
  if (result.changes === 0) throw new Error(`Post ${id} not found or already sent`)
}

export function deletePost(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM scheduled_posts WHERE id = ?').run(id)
}

/** Mark post as sending (prevents double-send) */
export function markSending(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare(
    "UPDATE scheduled_posts SET status = 'sending', updated_at = datetime('now') WHERE id = ? AND status = 'scheduled'"
  ).run(id)
  return result.changes > 0
}

/** Mark post as sent or error after send attempt */
export function markSent(id: number, success: boolean, error?: string): void {
  const db = getDatabase()
  if (success) {
    db.prepare(
      "UPDATE scheduled_posts SET status = 'sent', sent_time = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(id)
  } else {
    db.prepare(
      "UPDATE scheduled_posts SET status = 'error', error_message = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(error ?? 'Unknown error', id)
  }
}

/** Insert per-platform send result */
export function insertHistory(
  postId: number,
  platform: string,
  messageId: string | null,
  success: boolean,
  errorText: string | null
): void {
  const db = getDatabase()
  db.prepare(`
    INSERT INTO post_history (post_id, platform, platform_message_id, success, error_text, sent_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(postId, platform, messageId, success ? 1 : 0, errorText)
}

/** Get posts that are due for sending */
export function getDuePosts(): readonly ScheduledPost[] {
  const db = getDatabase()
  const rows = db.prepare(
    "SELECT * FROM scheduled_posts WHERE status = 'scheduled' AND scheduled_time <= datetime('now')"
  ).all() as PostRow[]
  return rows.map(rowToPost)
}
