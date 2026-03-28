import { registerHandler } from './register-handler'
import { getStats } from '../services/analytics.repository'
import { syncStats } from '../tasks/stats-sync'
import { app, dialog } from 'electron'
import { join } from 'path'
import { writeFileSync } from 'fs'

export function registerAnalyticsHandlers(): void {
  registerHandler('analytics:getStats', (payload) => {
    return getStats(payload)
  })

  registerHandler('analytics:syncNow', async () => {
    return syncStats()
  })

  registerHandler('analytics:exportStats', async (payload) => {
    const data = getStats({ period: payload.period, range: payload.range })
    const timestamp = new Date().toISOString().slice(0, 10)
    const defaultName = `community-stats-${timestamp}`

    if (payload.format === 'csv') {
      return exportCsv(data, defaultName)
    }
    return exportPdf(data, defaultName)
  })
}

async function exportCsv(
  data: ReturnType<typeof getStats>,
  defaultName: string
): Promise<{ filePath: string; format: 'csv' }> {
  const Papa = await import('papaparse')

  const rows = data.growth.map((g) => ({
    Date: g.date,
    'Discord Members': g.discord,
    'Telegram Members': g.telegram
  }))

  const csv = Papa.unparse(rows)
  const result = await dialog.showSaveDialog({
    defaultPath: join(app.getPath('downloads'), `${defaultName}.csv`),
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })

  if (result.canceled || !result.filePath) {
    throw new Error('Export cancelled')
  }

  writeFileSync(result.filePath, csv, 'utf-8')
  return { filePath: result.filePath, format: 'csv' }
}

async function exportPdf(
  data: ReturnType<typeof getStats>,
  defaultName: string
): Promise<{ filePath: string; format: 'pdf' }> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Community Analytics Report', 14, 20)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

  doc.setFontSize(12)
  let y = 40

  const { stats } = data
  const cards = [stats.totalMembers, stats.growthRate, stats.activeUsers, stats.engagementRate]
  for (const card of cards) {
    const trendSign = card.trend >= 0 ? '+' : ''
    doc.text(`${card.label}: ${card.value}${card.unit ?? ''} (${trendSign}${card.trend}%)`, 14, y)
    y += 8
  }

  y += 8
  doc.setFontSize(14)
  doc.text('Member Growth', 14, y)
  y += 8
  doc.setFontSize(10)
  for (const point of data.growth.slice(-14)) {
    doc.text(`${point.date}  Discord: ${point.discord}  Telegram: ${point.telegram}`, 14, y)
    y += 6
    if (y > 270) { doc.addPage(); y = 20 }
  }

  y += 8
  doc.setFontSize(14)
  doc.text('Platform Comparison', 14, y)
  y += 8
  doc.setFontSize(10)
  for (const metric of data.comparison) {
    doc.text(`${metric.metric} — Discord: ${metric.discord}  Telegram: ${metric.telegram}`, 14, y)
    y += 6
  }

  const result = await dialog.showSaveDialog({
    defaultPath: join(app.getPath('downloads'), `${defaultName}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })

  if (result.canceled || !result.filePath) {
    throw new Error('Export cancelled')
  }

  const buffer = doc.output('arraybuffer')
  writeFileSync(result.filePath, Buffer.from(buffer))
  return { filePath: result.filePath, format: 'pdf' }
}
