import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { loadEnv } from './env'
import { initDatabase, getDatabase, closeDatabase } from './services/database.service'
import { registerWindowHandlers } from './ipc/window'
import { registerSettingsHandlers } from './ipc/settings'
import { initPlatformManager, getPlatformManager } from './services/platform-manager'

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
  createWindow()

  // Auto-connect platforms after window is up
  await manager.autoConnect()

  // Start background stats sync (lazy import to avoid module-level issues)
  import('./tasks/stats-sync').then((m) => m.startStatsSync()).catch(() => {})
})

function registerAnalyticsHandlers(): void {
  ipcMain.removeHandler('analytics:getStats')
  ipcMain.handle('analytics:getStats', async (_event, payload) => {
    try {
      const db = getDatabase()
      const { start, end } = resolveRange(payload)

      const current = db.prepare(`
        SELECT platform, metric_name, metric_value, timestamp
        FROM platform_stats
        WHERE timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
      `).all(start, end) as Array<{ platform: string; metric_name: string; metric_value: number; timestamp: string }>

      const duration = new Date(end).getTime() - new Date(start).getTime()
      const prevStart = new Date(new Date(start).getTime() - duration).toISOString()
      const previous = db.prepare(`
        SELECT platform, metric_name, metric_value
        FROM platform_stats
        WHERE timestamp BETWEEN ? AND ?
      `).all(prevStart, start) as Array<{ platform: string; metric_name: string; metric_value: number }>

      const sum = (rows: Array<{ metric_name: string; metric_value: number }>, m: string): number =>
        rows.filter((r) => r.metric_name === m).reduce((s, r) => s + r.metric_value, 0)

      const curMembers = sum(current, 'member_count')
      const prevMembers = sum(previous, 'member_count')
      const curOnline = sum(current, 'online_count')
      const prevOnline = sum(previous, 'online_count')
      const curMessages = sum(current, 'message_count')
      const prevMessages = sum(previous, 'message_count')
      const engagement = curMembers > 0 ? (curMessages / curMembers) * 100 : 0
      const prevEngagement = prevMembers > 0 ? (prevMessages / prevMembers) * 100 : 0

      const trend = (cur: number, prev: number): number =>
        prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0

      const growth = db.prepare(`
        SELECT date(timestamp) as date, platform, MAX(metric_value) as value
        FROM platform_stats
        WHERE metric_name = 'member_count' AND timestamp BETWEEN ? AND ?
        GROUP BY date(timestamp), platform ORDER BY date(timestamp)
      `).all(start, end) as Array<{ date: string; platform: string; value: number }>

      const dateMap = new Map<string, { discord: number; telegram: number }>()
      for (const row of growth) {
        const e = dateMap.get(row.date) ?? { discord: 0, telegram: 0 }
        if (row.platform === 'discord') e.discord = row.value
        if (row.platform === 'telegram') e.telegram = row.value
        dateMap.set(row.date, e)
      }

      const heatmap = db.prepare(`
        SELECT CAST(strftime('%w', timestamp) AS INTEGER) as day,
               CAST(strftime('%H', timestamp) AS INTEGER) as hour,
               SUM(metric_value) as value
        FROM platform_stats
        WHERE metric_name = 'message_count' AND timestamp BETWEEN ? AND ?
        GROUP BY day, hour
      `).all(start, end) as Array<{ day: number; hour: number; value: number }>

      const comparison = db.prepare(`
        SELECT platform, metric_name, MAX(metric_value) as value
        FROM platform_stats WHERE timestamp BETWEEN ? AND ?
        GROUP BY platform, metric_name
      `).all(start, end) as Array<{ platform: string; metric_name: string; value: number }>

      const labels: Record<string, string> = { member_count: 'Members', online_count: 'Online', message_count: 'Messages' }

      return {
        success: true,
        data: {
          stats: {
            totalMembers: { label: 'Total Members', value: curMembers, previousValue: prevMembers, trend: trend(curMembers, prevMembers) },
            growthRate: { label: 'Growth Rate', value: curMembers - prevMembers, previousValue: 0, trend: 0, unit: '%' },
            activeUsers: { label: 'Active Users', value: curOnline, previousValue: prevOnline, trend: trend(curOnline, prevOnline) },
            engagementRate: { label: 'Engagement Rate', value: Math.round(engagement * 10) / 10, previousValue: Math.round(prevEngagement * 10) / 10, trend: trend(engagement, prevEngagement), unit: '%' }
          },
          growth: Array.from(dateMap.entries()).map(([date, v]) => ({ date, discord: v.discord, telegram: v.telegram })),
          heatmap: heatmap.map((r) => ({ day: r.day, hour: r.hour, value: r.value })),
          comparison: ['member_count', 'online_count', 'message_count'].map((m) => ({
            metric: labels[m] ?? m,
            discord: comparison.find((r) => r.platform === 'discord' && r.metric_name === m)?.value ?? 0,
            telegram: comparison.find((r) => r.platform === 'telegram' && r.metric_name === m)?.value ?? 0
          })),
          contributors: []
        }
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.removeHandler('analytics:syncNow')
  ipcMain.handle('analytics:syncNow', async () => {
    try {
      const mgr = getPlatformManager()
      const db = getDatabase()
      const stmt = db.prepare('INSERT INTO platform_stats (platform, metric_name, metric_value, timestamp) VALUES (?, ?, ?, datetime(\'now\'))')
      const result = { syncedAt: new Date().toISOString(), discord: { members: 0, online: 0 }, telegram: { members: 0 } }

      if (mgr.discord.status === 'connected') {
        const s = await mgr.discord.getStats()
        db.transaction(() => { stmt.run('discord', 'member_count', s.memberCount); stmt.run('discord', 'online_count', s.onlineCount); stmt.run('discord', 'message_count', s.messageCountToday) })()
        result.discord = { members: s.memberCount, online: s.onlineCount }
      }
      if (mgr.telegram.status === 'connected') {
        const s = await mgr.telegram.getStats()
        db.transaction(() => { stmt.run('telegram', 'member_count', s.memberCount); stmt.run('telegram', 'online_count', s.onlineCount); stmt.run('telegram', 'message_count', s.messageCountToday) })()
        result.telegram = { members: s.memberCount }
      }
      return { success: true, data: result }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.removeHandler('analytics:exportStats')
  ipcMain.handle('analytics:exportStats', async () => {
    return { success: false, error: 'Export not yet available' }
  })
}

function resolveRange(req: { period: string; range?: { start: string; end: string } }): { start: string; end: string } {
  if (req.period === 'custom' && req.range) return req.range
  const now = new Date()
  const end = now.toISOString()
  const ms: Record<string, number> = { day: 86400000, week: 604800000, month: 2592000000 }
  const offset = ms[req.period] ?? ms.week
  return { start: new Date(now.getTime() - offset).toISOString(), end }
}

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
