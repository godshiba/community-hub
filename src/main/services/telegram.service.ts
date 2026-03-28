import { Telegraf } from 'telegraf'
import type { ConnectionStatus } from '@shared/settings-types'
import type { PlatformService, PlatformStats } from './platform.types'
import { getEnv } from '../env'

export class TelegramService implements PlatformService {
  readonly platform = 'telegram' as const
  private bot: Telegraf | null = null
  private _status: ConnectionStatus = 'disconnected'
  private _username = ''
  private _trackedChats: Map<number, { title: string; memberCount: number }> = new Map()

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

      // Launch polling in background (non-blocking)
      this.bot.launch().catch(() => {
        this._status = 'error'
      })

      this._status = 'connected'
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

      try {
        const count = await ctx.telegram.getChatMemberCount(chatId)
        const chat = await ctx.telegram.getChat(chatId)
        const title = 'title' in chat ? chat.title : 'Unknown'

        this._trackedChats.set(chatId, { title, memberCount: count })
        return ctx.reply(`**${title}** — ${count} members`)
      } catch {
        return ctx.reply('Failed to get stats. Make sure I am an admin.')
      }
    })

    // /members command
    this.bot.command('members', async (ctx) => {
      if (ctx.chat.type === 'private') {
        return ctx.reply('This command only works in groups.')
      }
      try {
        const count = await ctx.telegram.getChatMemberCount(ctx.chat.id)
        return ctx.reply(`This group has ${count} members.`)
      } catch {
        return ctx.reply('Failed to get member count.')
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

    // Track when bot is added to a group
    this.bot.on('my_chat_member', async (ctx) => {
      const chat = ctx.myChatMember.chat
      if (chat.type === 'private') return

      const newStatus = ctx.myChatMember.new_chat_member.status
      if (newStatus === 'administrator' || newStatus === 'member') {
        try {
          const count = await ctx.telegram.getChatMemberCount(chat.id)
          const title = 'title' in chat ? chat.title : 'Unknown'
          this._trackedChats.set(chat.id, { title, memberCount: count })
        } catch { /* ignore */ }
      } else if (newStatus === 'left' || newStatus === 'kicked') {
        this._trackedChats.delete(chat.id)
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
