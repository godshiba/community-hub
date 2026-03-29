import { Telegraf } from 'telegraf'
import type { ConnectionStatus } from '@shared/settings-types'
import type { PlatformService, PlatformStats } from './platform.types'
import type { ChannelInfo } from '@shared/scheduler-types'
import { getEnv } from '../env'
import { getDatabase } from './database.service'

interface TrackedChat {
  title: string
  memberCount: number
}

export class TelegramService implements PlatformService {
  readonly platform = 'telegram' as const
  private bot: Telegraf | null = null
  private _status: ConnectionStatus = 'disconnected'
  private _username = ''
  private _trackedChats: Map<number, TrackedChat> = new Map()

  get status(): ConnectionStatus {
    return this._status
  }

  get botUsername(): string {
    return this._username
  }

  async connect(): Promise<{ success: boolean; username?: string; error?: string }> {
    const token = getEnv('TELEGRAM_BOT_TOKEN')
    if (!token) {
      return { success: false, error: 'TELEGRAM_BOT_TOKEN not set in .env' }
    }

    this.disconnect()
    this._status = 'connecting'

    try {
      this.bot = new Telegraf(token)
      this.setupHandlers()

      const me = await this.bot.telegram.getMe()
      this._username = me.username ?? me.first_name

      // Launch polling with explicit allowed_updates so my_chat_member fires
      this.bot.launch({
        allowedUpdates: [
          'message', 'channel_post', 'my_chat_member', 'chat_member',
          'callback_query', 'inline_query'
        ]
      }).catch(() => {
        this._status = 'error'
      })

      this._status = 'connected'

      // Restore tracked chats from DB and refresh member counts
      this.restoreTrackedChats().catch(() => {})

      return { success: true, username: this._username }
    } catch (err: unknown) {
      this._status = 'error'
      this.bot?.stop()
      this.bot = null
      return { success: false, error: err instanceof Error ? err.message : 'Failed to connect' }
    }
  }

  disconnect(): void {
    if (this.bot) {
      this.bot.stop()
      this.bot = null
    }
    this._status = 'disconnected'
    this._username = ''
  }

  async testConnection(): Promise<{ success: boolean; username?: string; error?: string }> {
    const token = getEnv('TELEGRAM_BOT_TOKEN')
    if (!token) {
      return { success: false, error: 'TELEGRAM_BOT_TOKEN not set in .env' }
    }

    try {
      const testBot = new Telegraf(token)
      const me = await testBot.telegram.getMe()
      return { success: true, username: me.username ?? me.first_name }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async getStats(): Promise<PlatformStats> {
    if (!this.bot || this._status !== 'connected') {
      return { memberCount: 0, onlineCount: 0, messageCountToday: 0 }
    }

    let memberCount = 0
    for (const chat of this._trackedChats.values()) {
      memberCount += chat.memberCount
    }

    return { memberCount, onlineCount: 0, messageCountToday: 0 }
  }

  listChannels(): ChannelInfo[] {
    const channels: ChannelInfo[] = []
    for (const [chatId, chat] of this._trackedChats.entries()) {
      channels.push({
        id: String(chatId),
        name: chat.title,
        platform: 'telegram'
      })
    }
    return channels
  }

  async sendMessage(channelId: string, content: string): Promise<{ messageId: string }> {
    if (!this.bot || this._status !== 'connected') {
      throw new Error('Telegram is not connected')
    }

    const chatId = Number(channelId)
    if (isNaN(chatId)) {
      throw new Error(`Invalid Telegram chat ID: ${channelId}`)
    }

    const msg = await this.bot.telegram.sendMessage(chatId, content)
    return { messageId: String(msg.message_id) }
  }

  // ---------------------------------------------------------------------------
  // DB persistence for tracked chats
  // ---------------------------------------------------------------------------

  private saveChat(chatId: number, title: string, memberCount: number): void {
    this._trackedChats.set(chatId, { title, memberCount })
    try {
      const db = getDatabase()
      db.prepare(`
        INSERT INTO tracked_chats (chat_id, platform, title, member_count, updated_at)
        VALUES (?, 'telegram', ?, ?, datetime('now'))
        ON CONFLICT(chat_id) DO UPDATE SET
          title = excluded.title,
          member_count = excluded.member_count,
          updated_at = datetime('now')
      `).run(chatId, title, memberCount)
    } catch { /* DB not ready yet */ }
  }

  private removeChat(chatId: number): void {
    this._trackedChats.delete(chatId)
    try {
      const db = getDatabase()
      db.prepare('DELETE FROM tracked_chats WHERE chat_id = ?').run(chatId)
    } catch { /* ignore */ }
  }

  private async restoreTrackedChats(): Promise<void> {
    if (!this.bot) return

    try {
      const db = getDatabase()
      const rows = db.prepare(
        "SELECT chat_id, title, member_count FROM tracked_chats WHERE platform = 'telegram'"
      ).all() as Array<{ chat_id: number; title: string; member_count: number }>

      for (const row of rows) {
        try {
          // Refresh member count from Telegram API
          const count = await this.bot.telegram.getChatMembersCount(row.chat_id)
          const chat = await this.bot.telegram.getChat(row.chat_id)
          const title = 'title' in chat ? chat.title : row.title
          this.saveChat(row.chat_id, title, count)
        } catch {
          // Bot may have been removed from this group — keep old data
          this._trackedChats.set(row.chat_id, { title: row.title, memberCount: row.member_count })
        }
      }
    } catch { /* DB not available */ }
  }

  // ---------------------------------------------------------------------------
  // Bot command handlers
  // ---------------------------------------------------------------------------

  private setupHandlers(): void {
    if (!this.bot) return

    // /start command
    this.bot.start((ctx) => {
      ctx.reply(
        `Hello! I'm your Community Hub bot.\n\n` +
        `Add me as an admin to your group so I can help manage your community.\n\n` +
        `Commands:\n` +
        `/stats — group statistics\n` +
        `/members — member count\n` +
        `/warn — warn a member (reply to their message)\n` +
        `/ban — ban a member (reply to their message)`
      )
    })

    // /help command
    this.bot.help((ctx) => {
      ctx.reply(
        `Available commands:\n` +
        `/stats — group statistics\n` +
        `/members — member count\n` +
        `/warn <reason> — warn a member (reply to their message)\n` +
        `/ban <reason> — ban a member (reply to their message)\n` +
        `/unban <user_id> — unban a user by ID`
      )
    })

    // /stats command
    this.bot.command('stats', async (ctx) => {
      const chatId = ctx.chat.id
      if (ctx.chat.type === 'private') {
        return ctx.reply('This command only works in groups.')
      }

      const title = 'title' in ctx.chat ? ctx.chat.title : 'Unknown'
      console.log(`[Telegram] /stats requested in chat ${chatId} (${title}), type: ${ctx.chat.type}`)

      let count = 0
      try {
        count = await ctx.telegram.getChatMembersCount(chatId)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[Telegram] getChatMembersCount failed for ${chatId}: ${msg}`)
        // Still track the chat even if we can't get member count
      }

      this.saveChat(chatId, title, count)
      return ctx.reply(`${title} — ${count} members`)
    })

    // /members command
    this.bot.command('members', async (ctx) => {
      if (ctx.chat.type === 'private') {
        return ctx.reply('This command only works in groups.')
      }
      try {
        const count = await ctx.telegram.getChatMembersCount(ctx.chat.id)
        return ctx.reply(`This group has ${count} members.`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[Telegram] /members failed for ${ctx.chat.id}: ${msg}`)
        return ctx.reply(`Failed to get member count: ${msg}`)
      }
    })

    // /warn command (reply to a message)
    this.bot.command('warn', async (ctx) => {
      if (ctx.chat.type === 'private') return
      const replyMsg = ctx.message.reply_to_message
      if (!replyMsg) {
        return ctx.reply('Reply to a message to warn that user.')
      }

      const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id)
      const isAdmin = admins.some((a) => a.user.id === ctx.from.id)
      if (!isAdmin) {
        return ctx.reply('Only admins can warn members.')
      }

      const reason = ctx.message.text.split(' ').slice(1).join(' ') || 'No reason provided'
      const warnedUser = replyMsg.from
      // Actual warning storage will be in Phase 5
      return ctx.reply(
        `Warned ${warnedUser?.first_name ?? 'user'}: ${reason}`
      )
    })

    // /ban command (reply to a message)
    this.bot.command('ban', async (ctx) => {
      if (ctx.chat.type === 'private') return
      const replyMsg = ctx.message.reply_to_message
      if (!replyMsg || !replyMsg.from) {
        return ctx.reply('Reply to a message to ban that user.')
      }

      const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id)
      const isAdmin = admins.some((a) => a.user.id === ctx.from.id)
      if (!isAdmin) {
        return ctx.reply('Only admins can ban members.')
      }

      try {
        await ctx.telegram.banChatMember(ctx.chat.id, replyMsg.from.id)
        const reason = ctx.message.text.split(' ').slice(1).join(' ') || 'No reason provided'
        return ctx.reply(`Banned ${replyMsg.from.first_name}: ${reason}`)
      } catch {
        return ctx.reply('Failed to ban. Check bot permissions and role hierarchy.')
      }
    })

    // /unban command
    this.bot.command('unban', async (ctx) => {
      if (ctx.chat.type === 'private') return

      const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id)
      const isAdmin = admins.some((a) => a.user.id === ctx.from.id)
      if (!isAdmin) {
        return ctx.reply('Only admins can unban members.')
      }

      const userId = parseInt(ctx.message.text.split(' ')[1], 10)
      if (isNaN(userId)) {
        return ctx.reply('Usage: /unban <user_id>')
      }

      try {
        await ctx.telegram.unbanChatMember(ctx.chat.id, userId)
        return ctx.reply(`Unbanned user ${userId}`)
      } catch {
        return ctx.reply('Failed to unban. Check the user ID.')
      }
    })

    // Auto-discover groups and channels from ANY incoming message
    this.bot.on('message', async (ctx) => {
      const chat = ctx.chat
      if (chat.type === 'private') return
      if (this._trackedChats.has(chat.id)) return // already tracked

      const title = 'title' in chat ? chat.title : 'Unknown'
      try {
        const count = await ctx.telegram.getChatMembersCount(chat.id)
        this.saveChat(chat.id, title, count)
      } catch {
        // Still save with 0 members so it appears in channel list
        this.saveChat(chat.id, title, 0)
      }
    })

    // Auto-discover from channel posts (channels don't fire 'message')
    this.bot.on('channel_post', async (ctx) => {
      const chat = ctx.chat
      if (this._trackedChats.has(chat.id)) return

      const title = 'title' in chat ? chat.title : 'Unknown'
      try {
        const count = await ctx.telegram.getChatMembersCount(chat.id)
        this.saveChat(chat.id, title, count)
      } catch {
        this.saveChat(chat.id, title, 0)
      }
    })

    // Track when bot is added to a group
    this.bot.on('my_chat_member', async (ctx) => {
      const chat = ctx.myChatMember.chat
      if (chat.type === 'private') return

      const newStatus = ctx.myChatMember.new_chat_member.status
      if (newStatus === 'administrator' || newStatus === 'member') {
        try {
          const count = await ctx.telegram.getChatMembersCount(chat.id)
          const title = 'title' in chat ? chat.title : 'Unknown'
          this.saveChat(chat.id, title, count)
        } catch { /* ignore */ }
      } else if (newStatus === 'left' || newStatus === 'kicked') {
        this.removeChat(chat.id)
      }
    })

    // Track member joins/leaves for incremental member database
    this.bot.on('chat_member', async (ctx) => {
      const chatId = ctx.chatMember.chat.id
      const tracked = this._trackedChats.get(chatId)
      if (!tracked) return

      const newStatus = ctx.chatMember.new_chat_member.status
      const oldStatus = ctx.chatMember.old_chat_member.status

      if (oldStatus === 'left' && (newStatus === 'member' || newStatus === 'administrator')) {
        tracked.memberCount += 1
      } else if ((oldStatus === 'member' || oldStatus === 'administrator') && (newStatus === 'left' || newStatus === 'kicked')) {
        tracked.memberCount = Math.max(0, tracked.memberCount - 1)
      }
      // Full member DB tracking will be wired in Phase 5
    })
  }
}
