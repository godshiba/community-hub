import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { loadEnv } from './env'
import { initDatabase, closeDatabase } from './services/database.service'
import { registerWindowHandlers } from './ipc/window'
import { registerSettingsHandlers } from './ipc/settings'
import { registerSchedulerHandlers } from './ipc/scheduler'
import { registerModerationHandlers } from './ipc/moderation'
import { registerEventHandlers } from './ipc/events'
import { registerAgentHandlers } from './ipc/agent'
import { registerReportsHandlers } from './ipc/reports'
import { registerAnalyticsHandlers } from './ipc/analytics'
import { initPlatformManager, getPlatformManager } from './services/platform-manager'
import { initAgentService, getAgentService } from './services/ai/agent.service'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 10 },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  loadEnv()
  initDatabase()

  const manager = initPlatformManager()
  registerWindowHandlers()
  registerSettingsHandlers()
  registerAnalyticsHandlers()
  registerSchedulerHandlers()
  registerModerationHandlers()
  registerEventHandlers()
  registerAgentHandlers()
  registerReportsHandlers()
  initAgentService()
  createWindow()

  // Auto-connect platforms after window is up
  await manager.autoConnect()

  // Wire platform messages to AI agent
  const agent = getAgentService()
  manager.onMessage((msg) => {
    // Detect if the bot was mentioned by name, @username, or Discord <@ID>
    const profile = agent.conversation.getProfile()
    const botName = profile?.name?.toLowerCase() ?? ''
    const discordBotId = manager.discord.botUserId
    const telegramBotUser = manager.telegram.botUsername?.toLowerCase() ?? ''
    const lower = msg.content.toLowerCase()
    const botMentioned =
      (botName !== '' && lower.includes(botName)) ||
      (msg.platform === 'discord' && discordBotId != null && msg.content.includes(`<@${discordBotId}>`)) ||
      (msg.platform === 'telegram' && telegramBotUser !== '' && lower.includes(`@${telegramBotUser}`))

    agent.handleMessage({
      platform: msg.platform,
      channelId: msg.channelId,
      userId: msg.userId,
      username: msg.username,
      message: msg.content,
      botMentioned
    }).then(async (result) => {
      // Auto-send high-confidence responses
      if (result.conversationResult && result.conversationResult.action.status === 'completed') {
        try {
          const service = msg.platform === 'discord' ? manager.discord : manager.telegram
          if (service.status === 'connected') {
            await service.sendMessage(msg.channelId, result.conversationResult.response)
          }
        } catch { /* non-fatal */ }
      }

      // Execute automation actions — send response if the rule produced one
      for (const match of result.automationMatches) {
        if (match.responseText && msg.channelId) {
          try {
            const service = msg.platform === 'discord' ? manager.discord : manager.telegram
            if (service.status === 'connected') {
              await service.sendMessage(msg.channelId, match.responseText)
            }
          } catch { /* non-fatal */ }
        }
      }
    }).catch(() => { /* agent error should not crash platform listener */ })
  })

  manager.onNewMember((member) => {
    agent.handleNewMember({
      platform: member.platform,
      channelId: member.channelId,
      userId: member.userId,
      username: member.username
    })
  })

  // Start background tasks
  import('./tasks/stats-sync').then((m) => m.startStatsSync()).catch(() => {})
  import('./tasks/post-sender').then((m) => m.startPostSender()).catch(() => {})
  import('./tasks/member-sync').then((m) => m.startMemberSync()).catch(() => {})
  import('./tasks/event-reminders').then((m) => m.startEventReminders()).catch(() => {})
})

app.on('window-all-closed', () => {
  try { getPlatformManager().disconnectAll() } catch { /* not initialized */ }
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
