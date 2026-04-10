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
import { registerSpamHandlers } from './ipc/spam'
import { registerAuditHandlers } from './ipc/audit'
import { registerRoleHandlers } from './ipc/roles'
import { registerContentModerationHandlers } from './ipc/content-moderation'
import { checkMessage as checkSpam } from './services/spam/spam.engine'
import { recordJoin as recordRaidJoin } from './services/spam/raid.detector'
import { executeSpamAction, executeRaidActions } from './services/spam/raid.actions'
import * as spamRepo from './services/spam/spam.repository'
import { logAuditEntry } from './services/audit.repository'
import { getMemberByPlatformId } from './services/moderation.repository'
import { initPlatformManager, getPlatformManager } from './services/platform-manager'
import { initAgentService, getAgentService } from './services/ai/agent.service'
import { handleAutoAssignOnJoin } from './services/roles.service'
import { classifyContent, isSuspicious } from './services/ai/content-classifier'
import { evaluatePolicy, executePolicyAction } from './services/ai/content-policy.engine'
import { executeContentAction } from './services/ai/content-mod.actions'
import { getPolicy as getContentModPolicy } from './services/ai/content-moderation.repository'

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
  registerSpamHandlers()
  registerAuditHandlers()
  registerRoleHandlers()
  registerContentModerationHandlers()
  initAgentService()
  createWindow()

  // Auto-connect platforms after window is up
  await manager.autoConnect()

  // Wire platform messages to AI agent
  const agent = getAgentService()
  manager.onMessage(async (msg) => {
    // --- Spam check (runs before AI agent) ---
    const spamResult = checkSpam(msg.platform, msg.userId, msg.username, msg.channelId, msg.messageId, msg.content)
    if (spamResult?.triggered) {
      spamRepo.logSpamEvent({
        platform: msg.platform,
        userId: msg.userId,
        username: msg.username,
        channelId: msg.channelId,
        ruleType: spamResult.ruleType,
        ruleName: spamResult.ruleName,
        actionTaken: spamResult.action,
        messageContent: msg.content.slice(0, 500)
      })

      const spamMember = getMemberByPlatformId(msg.platform, msg.userId)
      logAuditEntry({
        moderator: 'spam-engine',
        moderatorType: 'system',
        targetMemberId: spamMember?.id ?? null,
        targetUsername: msg.username,
        actionType: 'spam_detection',
        reason: `${spamResult.ruleName}: ${spamResult.action}`,
        platform: msg.platform,
        metadata: { ruleType: spamResult.ruleType, action: spamResult.action }
      })

      executeSpamAction(msg.platform, msg.userId, msg.channelId, spamResult.messageRefs, spamResult.action, spamResult.muteDurationMinutes).catch(() => {})
      return // Don't pass spam to AI agent
    }

    // --- AI content moderation (runs after spam check, before agent) ---
    const contentModPolicy = getContentModPolicy()
    if (contentModPolicy?.enabled) {
      const shouldClassify = contentModPolicy.classificationMode === 'all' || isSuspicious(msg.content)
      if (shouldClassify && agent.provider) {
        try {
          const classification = await classifyContent(agent.provider, msg.content)
          if (classification.primaryCategory !== 'clean') {
            const policyResult = evaluatePolicy(classification, msg.platform)
            if (policyResult.shouldAct) {
              executePolicyAction(
                policyResult, msg.platform, msg.userId, msg.username,
                msg.channelId, msg.messageId, msg.content, classification
              )
              if (!policyResult.testMode) {
                await executeContentAction(
                  policyResult.action, msg.platform, msg.userId,
                  msg.channelId, msg.messageId
                )
                return // Block message from reaching AI agent
              }
            }
          }
        } catch {
          // Classification failed — let message through to agent
        }
      }
    }

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
    // --- Raid detection ---
    const raidResult = recordRaidJoin(member.platform, member.userId, member.username)
    if (raidResult.stateChanged && raidResult.newState === 'active') {
      logAuditEntry({
        moderator: 'raid-detector',
        moderatorType: 'system',
        targetMemberId: null,
        targetUsername: member.username,
        actionType: 'raid_action',
        reason: `Raid detected: ${raidResult.joinCount} joins in window`,
        platform: member.platform,
        metadata: { joinCount: raidResult.joinCount, actions: raidResult.actions }
      })
      executeRaidActions(member.platform, raidResult).catch(() => {})
    }

    // Auto-assign roles on join
    handleAutoAssignOnJoin(member.platform, member.userId, member.username).catch(() => {})

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
  import('./tasks/role-expiry').then((m) => m.startRoleExpiry()).catch(() => {})
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
