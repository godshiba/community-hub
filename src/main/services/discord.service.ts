import { Client, GatewayIntentBits, Events, REST, Routes, ChannelType } from 'discord.js'
import type { Guild, GuildMember, TextChannel } from 'discord.js'
import type { ConnectionStatus } from '@shared/settings-types'
import type { PlatformService, PlatformStats, PlatformMember, MessageCallback, NewMemberCallback } from './platform.types'
import type { ChannelInfo } from '@shared/scheduler-types'
import { getEnv } from '../env'
import * as modRepo from './moderation.repository'

export class DiscordService implements PlatformService {
  readonly platform = 'discord' as const
  private client: Client | null = null
  private _status: ConnectionStatus = 'disconnected'
  private _username = ''
  private _guilds: Map<string, Guild> = new Map()
  private _messageCallbacks: MessageCallback[] = []
  private _newMemberCallbacks: NewMemberCallback[] = []

  get status(): ConnectionStatus {
    return this._status
  }

  get botUsername(): string {
    return this._username
  }

  get botUserId(): string {
    return this.client?.user?.id ?? ''
  }

  get guilds(): Guild[] {
    return [...this._guilds.values()]
  }

  async connect(): Promise<{ success: boolean; username?: string; error?: string }> {
    const token = getEnv('DISCORD_BOT_TOKEN')
    if (!token) {
      return { success: false, error: 'DISCORD_BOT_TOKEN not set in .env' }
    }

    this.disconnect()
    this._status = 'connecting'

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildModeration,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.MessageContent
        ]
      })

      this.setupEventHandlers()
      await this.client.login(token)
      this._username = this.client.user?.username ?? 'Unknown'
      this._status = 'connected'

      // Cache guilds
      this._guilds = new Map(
        this.client.guilds.cache.map((g) => [g.id, g])
      )

      return { success: true, username: this._username }
    } catch (err: unknown) {
      this._status = 'error'
      this.client?.destroy()
      this.client = null
      return { success: false, error: err instanceof Error ? err.message : 'Failed to connect' }
    }
  }

  onMessage(callback: MessageCallback): void {
    this._messageCallbacks.push(callback)
  }

  onNewMember(callback: NewMemberCallback): void {
    this._newMemberCallbacks.push(callback)
  }

  disconnect(): void {
    if (this.client) {
      this.client.destroy()
      this.client = null
    }
    this._status = 'disconnected'
    this._username = ''
    this._guilds.clear()
  }

  async testConnection(): Promise<{ success: boolean; username?: string; error?: string }> {
    const token = getEnv('DISCORD_BOT_TOKEN')
    if (!token) {
      return { success: false, error: 'DISCORD_BOT_TOKEN not set in .env' }
    }

    const testClient = new Client({ intents: [GatewayIntentBits.Guilds] })

    try {
      await testClient.login(token)
      const username = testClient.user?.username ?? 'Unknown'
      testClient.destroy()
      return { success: true, username }
    } catch (err: unknown) {
      testClient.destroy()
      return { success: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }

  async getStats(): Promise<PlatformStats> {
    if (!this.client || this._status !== 'connected') {
      return { memberCount: 0, onlineCount: 0, messageCountToday: 0 }
    }

    let memberCount = 0
    let onlineCount = 0

    for (const guild of this._guilds.values()) {
      memberCount += guild.memberCount
      onlineCount += guild.approximatePresenceCount ?? 0
    }

    return { memberCount, onlineCount, messageCountToday: 0 }
  }

  listChannels(): ChannelInfo[] {
    const channels: ChannelInfo[] = []
    for (const guild of this._guilds.values()) {
      for (const ch of guild.channels.cache.values()) {
        if (ch.type === ChannelType.GuildText) {
          channels.push({
            id: ch.id,
            name: ch.name,
            platform: 'discord',
            guildId: guild.id,
            guildName: guild.name
          })
        }
      }
    }
    return channels
  }

  async sendMessage(channelId: string, content: string): Promise<{ messageId: string }> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    const channel = this.client.channels.cache.get(channelId) as TextChannel | undefined
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel ${channelId} not found or not a text channel`)
    }

    const msg = await channel.send(content)
    return { messageId: msg.id }
  }

  async fetchMembers(): Promise<PlatformMember[]> {
    if (!this.client || this._status !== 'connected') return []

    const members: PlatformMember[] = []
    for (const guild of this._guilds.values()) {
      try {
        const fetched = await guild.members.fetch()
        for (const member of fetched.values()) {
          if (member.user.bot) continue
          members.push({
            platformUserId: member.user.id,
            username: member.user.username,
            platform: 'discord',
            joinDate: member.joinedAt?.toISOString() ?? null,
            status: 'active'
          })
        }
      } catch (err: unknown) {
        console.error(`[Discord] fetchMembers failed for guild ${guild.name}:`, err instanceof Error ? err.message : err)
      }
    }
    return members
  }

  async banUser(platformUserId: string, reason?: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    let lastError: string | null = null
    for (const guild of this._guilds.values()) {
      try {
        await guild.bans.create(platformUserId, { reason: reason ?? 'Banned via Community Hub' })
        return
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }
    throw new Error(`Could not ban user ${platformUserId}: ${lastError ?? 'not found in any guild'}`)
  }

  async unbanUser(platformUserId: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    let lastError: string | null = null
    for (const guild of this._guilds.values()) {
      try {
        await guild.bans.remove(platformUserId)
        return
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }
    throw new Error(`Could not unban user ${platformUserId}: ${lastError ?? 'not found in any guild'}`)
  }

  async muteUser(platformUserId: string, durationMinutes: number): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    const durationMs = durationMinutes * 60 * 1000
    let lastError: string | null = null
    for (const guild of this._guilds.values()) {
      try {
        const member = await guild.members.fetch(platformUserId)
        await member.timeout(durationMs, 'Automated spam protection')
        return
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }
    throw new Error(`Could not timeout user ${platformUserId}: ${lastError ?? 'not found in any guild'}`)
  }

  async kickUser(platformUserId: string, reason?: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    let lastError: string | null = null
    for (const guild of this._guilds.values()) {
      try {
        const member = await guild.members.fetch(platformUserId)
        await member.kick(reason ?? 'Kicked via Community Hub')
        return
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }
    throw new Error(`Could not kick user ${platformUserId}: ${lastError ?? 'not found in any guild'}`)
  }

  async fetchRoles(): Promise<{ id: string; name: string; color: string | null; position: number }[]> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    const roles: { id: string; name: string; color: string | null; position: number }[] = []
    for (const guild of this._guilds.values()) {
      const guildRoles = await guild.roles.fetch()
      for (const role of guildRoles.values()) {
        if (role.name === '@everyone') continue
        roles.push({
          id: role.id,
          name: role.name,
          color: role.hexColor !== '#000000' ? role.hexColor : null,
          position: role.position
        })
      }
    }
    return roles.sort((a, b) => b.position - a.position)
  }

  async assignRole(platformUserId: string, roleId: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    for (const guild of this._guilds.values()) {
      try {
        const member = await guild.members.fetch(platformUserId)
        await member.roles.add(roleId)
        return
      } catch { /* user may not be in this guild */ }
    }
    throw new Error(`Could not assign role to user ${platformUserId}`)
  }

  async removeRole(platformUserId: string, roleId: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    for (const guild of this._guilds.values()) {
      try {
        const member = await guild.members.fetch(platformUserId)
        await member.roles.remove(roleId)
        return
      } catch { /* user may not be in this guild */ }
    }
    throw new Error(`Could not remove role from user ${platformUserId}`)
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    if (!this.client || this._status !== 'connected') {
      throw new Error('Discord is not connected')
    }

    const channel = this.client.channels.cache.get(channelId)
    if (!channel?.isTextBased()) throw new Error(`Channel ${channelId} not found`)

    const msg = channel.messages.cache.get(messageId)
    if (msg) {
      await msg.delete()
    } else {
      const fetched = await (channel as TextChannel).messages.fetch(messageId)
      await fetched.delete()
    }
  }

  /** Delete multiple messages at once (max 100, must be < 14 days old) */
  async bulkDeleteMessages(channelId: string, messageIds: readonly string[]): Promise<void> {
    if (!this.client || this._status !== 'connected') return
    if (messageIds.length === 0) return

    const channel = this.client.channels.cache.get(channelId)
    if (!channel?.isTextBased()) return

    await (channel as TextChannel).bulkDelete(messageIds as string[])
  }

  /** Generate the OAuth2 URL to invite the bot to a server */
  getInviteUrl(): string | null {
    const clientId = getEnv('DISCORD_CLIENT_ID')
    if (!clientId) return null

    // Permissions: Kick, Ban, ManageChannels, ManageGuild, ViewChannel,
    // SendMessages, ManageMessages, ReadMessageHistory, ManageRoles, ModerateMembers
    const permissions = '1099780071510'
    const scopes = 'bot%20applications.commands'
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`
  }

  /** Register slash commands with Discord API */
  async registerCommands(): Promise<void> {
    const token = getEnv('DISCORD_BOT_TOKEN')
    const clientId = getEnv('DISCORD_CLIENT_ID')
    if (!token || !clientId) return

    const rest = new REST({ version: '10' }).setToken(token)

    const commands = [
      {
        name: 'stats',
        description: 'Show community statistics for this server'
      },
      {
        name: 'warn',
        description: 'Warn a member',
        options: [
          { name: 'user', description: 'Member to warn', type: 6, required: true },
          { name: 'reason', description: 'Reason for warning', type: 3, required: true }
        ]
      },
      {
        name: 'ban',
        description: 'Ban a member',
        options: [
          { name: 'user', description: 'Member to ban', type: 6, required: true },
          { name: 'reason', description: 'Reason for ban', type: 3, required: false }
        ]
      },
      {
        name: 'unban',
        description: 'Unban a user by ID',
        options: [
          { name: 'user_id', description: 'User ID to unban', type: 3, required: true }
        ]
      },
      {
        name: 'members',
        description: 'Show member count and growth info'
      }
    ]

    await rest.put(Routes.applicationCommands(clientId), { body: commands })
  }

  private setupEventHandlers(): void {
    if (!this.client) return

    this.client.on(Events.Error, () => {
      this._status = 'error'
    })

    this.client.on(Events.GuildCreate, (guild) => {
      this._guilds.set(guild.id, guild)
    })

    this.client.on(Events.GuildDelete, (guild) => {
      this._guilds.delete(guild.id)
    })

    // Member tracking — these events require GUILD_MEMBERS privileged intent
    this.client.on(Events.GuildMemberAdd, (member: GuildMember) => {
      if (member.user.bot) return
      try {
        modRepo.upsertMember('discord', member.user.id, member.user.username, member.joinedAt?.toISOString() ?? null)
      } catch { /* DB may not be ready */ }
      // Forward to agent callbacks
      for (const cb of this._newMemberCallbacks) {
        try {
          cb({
            platform: 'discord',
            channelId: member.guild.systemChannelId ?? '',
            userId: member.user.id,
            username: member.user.username
          })
        } catch { /* callback error should not break event loop */ }
      }
    })

    this.client.on(Events.GuildMemberRemove, (member) => {
      if (!member.user || member.user.bot) return
      try {
        const existing = modRepo.getMemberByPlatformId('discord', member.user.id)
        if (existing) {
          modRepo.upsertMember('discord', member.user.id, member.user.username, null, 'left')
        }
      } catch { /* ignore */ }
    })

    // Moderation events — requires GUILD_MODERATION intent
    this.client.on(Events.GuildBanAdd, (ban) => {
      try {
        const existing = modRepo.getMemberByPlatformId('discord', ban.user.id)
        if (existing) {
          modRepo.banMember(existing.id, ban.reason ?? 'Banned via Discord')
        }
      } catch { /* ignore */ }
    })

    // Forward messages to agent callbacks
    this.client.on(Events.MessageCreate, (message) => {
      if (message.author.bot) return
      if (!message.content) return
      for (const cb of this._messageCallbacks) {
        try {
          cb({
            platform: 'discord',
            channelId: message.channelId,
            messageId: message.id,
            userId: message.author.id,
            username: message.author.username,
            content: message.content
          })
        } catch { /* callback error should not break event loop */ }
      }
    })

    // Note: GuildMemberAdd new-member callbacks are handled in the handler above

    // Interaction handler for slash commands — owner-only
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return

      const ownerId = getEnv('OWNER_DISCORD_ID')?.trim()
      if (ownerId && interaction.user.id !== ownerId) {
        await interaction.reply({ content: 'Only the bot owner can use commands.', ephemeral: true })
        return
      }

      switch (interaction.commandName) {
        case 'stats': {
          const guild = interaction.guild
          if (!guild) {
            await interaction.reply({ content: 'This command only works in a server.', ephemeral: true })
            return
          }
          await interaction.reply({
            content: `**${guild.name}** — ${guild.memberCount} members`,
            ephemeral: true
          })
          break
        }

        case 'members': {
          const guild = interaction.guild
          if (!guild) return
          await interaction.reply({
            content: `**${guild.name}** has ${guild.memberCount} members`,
            ephemeral: true
          })
          break
        }

        case 'warn': {
          const user = interaction.options.getUser('user', true)
          const reason = interaction.options.getString('reason', true)
          await interaction.reply({
            content: `Warned **${user.username}**: ${reason}`,
            ephemeral: true
          })
          break
        }

        case 'ban': {
          const user = interaction.options.getUser('user', true)
          const reason = interaction.options.getString('reason') ?? 'No reason provided'
          try {
            await interaction.guild?.members.ban(user.id, { reason })
            await interaction.reply({ content: `Banned **${user.username}**: ${reason}`, ephemeral: true })
          } catch {
            await interaction.reply({ content: 'Failed to ban. Check bot permissions and role hierarchy.', ephemeral: true })
          }
          break
        }

        case 'unban': {
          const userId = interaction.options.getString('user_id', true)
          try {
            await interaction.guild?.members.unban(userId)
            await interaction.reply({ content: `Unbanned user ${userId}`, ephemeral: true })
          } catch {
            await interaction.reply({ content: 'Failed to unban. Check the user ID.', ephemeral: true })
          }
          break
        }
      }
    })
  }
}
