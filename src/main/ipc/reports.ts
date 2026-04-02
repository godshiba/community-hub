import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import { registerHandler } from './register-handler'
import * as repo from '../services/reports.repository'
import { createProvider } from '../services/ai/provider.factory'
import { loadAiConfig } from '../services/credentials.repository'
import type { ReportData } from '@shared/reports-types'

export function registerReportsHandlers(): void {
  registerHandler('reports:generate', async (config) => {
    const data = repo.generateReport(config)

    // Optional AI narrative
    const enriched = await enrichWithAi(data)

    const title = buildTitle(config.platformFilter, data.periodStart, data.periodEnd)
    return repo.saveReport(title, enriched)
  })

  registerHandler('reports:list', () => {
    return repo.listReports()
  })

  registerHandler('reports:get', (payload) => {
    return repo.getReport(payload.id)
  })

  registerHandler('reports:delete', (payload) => {
    repo.deleteReport(payload.id)
  })

  registerHandler('reports:exportPDF', async (payload) => {
    const report = repo.getReport(payload.id)

    const result = await dialog.showSaveDialog({
      defaultPath: `report-${report.id}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (result.canceled || !result.filePath) {
      throw new Error('Export cancelled')
    }

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    renderPdf(doc, report.title, report.data)

    const buffer = doc.output('arraybuffer')
    writeFileSync(result.filePath, Buffer.from(buffer))

    return { filePath: result.filePath }
  })
}

function buildTitle(platform: string, start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const p = platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)
  return `${p} Report: ${s} - ${e}`
}

async function enrichWithAi(data: ReportData): Promise<ReportData> {
  try {
    const config = loadAiConfig()
    const provider = createProvider(config)
    if (!provider) return data

    const summary = buildSummaryText(data)
    const system = 'You are a community analytics expert. Write a brief narrative summary (3-5 sentences) of the community health data provided. Include key insights and one actionable recommendation. Be concise and data-driven.'
    const response = await provider.complete(system, summary)
    return { ...data, aiNarrative: response }
  } catch {
    return data
  }
}

function buildSummaryText(data: ReportData): string {
  const parts: string[] = [`Report period: ${data.periodStart} to ${data.periodEnd}`]

  if (data.growth) {
    parts.push(`Members: ${data.growth.currentMembers} (${data.growth.growthRate > 0 ? '+' : ''}${data.growth.growthRate}% growth)`)
  }
  if (data.engagement) {
    parts.push(`Engagement: ${data.engagement.engagementRate}% rate, ${data.engagement.messagesPerUser} msgs/user`)
  }
  if (data.retention) {
    parts.push(`Retention: ${data.retention.retentionRate}%, Churn: ${data.retention.churnRate}%`)
  }
  if (data.moderation) {
    parts.push(`Moderation: ${data.moderation.totalWarnings} warnings, ${data.moderation.totalBans} bans`)
  }
  if (data.events) {
    parts.push(`Events: ${data.events.eventsHeld} held, ${data.events.totalRSVPs} RSVPs, ${data.events.attendanceRate}% attendance`)
  }

  return parts.join('\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPdf(doc: any, title: string, data: ReportData): void {
  let y = 20

  // Title
  doc.setFontSize(18)
  doc.setTextColor(40, 40, 40)
  doc.text(title, 14, y)
  y += 10

  // Period
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const periodStart = new Date(data.periodStart).toLocaleDateString()
  const periodEnd = new Date(data.periodEnd).toLocaleDateString()
  doc.text(`Period: ${periodStart} - ${periodEnd}`, 14, y)
  y += 12

  // Growth section
  if (data.growth) {
    y = renderSection(doc, 'Growth', y)
    doc.setFontSize(10)
    doc.text(`Current Members: ${data.growth.currentMembers}`, 20, y); y += 6
    doc.text(`Previous Members: ${data.growth.previousMembers}`, 20, y); y += 6
    doc.text(`Growth Rate: ${data.growth.growthRate}%`, 20, y); y += 10
  }

  // Engagement section
  if (data.engagement) {
    y = renderSection(doc, 'Engagement', y)
    doc.setFontSize(10)
    doc.text(`Active Users: ${data.engagement.activeUsers}`, 20, y); y += 6
    doc.text(`Total Users: ${data.engagement.totalUsers}`, 20, y); y += 6
    doc.text(`Engagement Rate: ${data.engagement.engagementRate}%`, 20, y); y += 6
    doc.text(`Messages per User: ${data.engagement.messagesPerUser}`, 20, y); y += 10
  }

  // Retention section
  if (data.retention) {
    y = renderSection(doc, 'Retention', y)
    doc.setFontSize(10)
    doc.text(`Retention Rate: ${data.retention.retentionRate}%`, 20, y); y += 6
    doc.text(`Churn Rate: ${data.retention.churnRate}%`, 20, y); y += 6
    doc.text(`New Users: ${data.retention.newUsers}`, 20, y); y += 10
  }

  // Moderation section
  if (data.moderation) {
    y = renderSection(doc, 'Moderation', y)
    doc.setFontSize(10)
    doc.text(`Warnings: ${data.moderation.totalWarnings}`, 20, y); y += 6
    doc.text(`Bans: ${data.moderation.totalBans}`, 20, y); y += 6
    doc.text(`Resolved: ${data.moderation.resolved}`, 20, y); y += 6
    doc.text(`Pending: ${data.moderation.pending}`, 20, y); y += 10
  }

  // Events section
  if (data.events) {
    y = renderSection(doc, 'Events', y)
    doc.setFontSize(10)
    doc.text(`Events Held: ${data.events.eventsHeld}`, 20, y); y += 6
    doc.text(`Total RSVPs: ${data.events.totalRSVPs}`, 20, y); y += 6
    doc.text(`Attendance Rate: ${data.events.attendanceRate}%`, 20, y); y += 10
  }

  // AI narrative
  if (data.aiNarrative) {
    y = renderSection(doc, 'AI Insights', y)
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(data.aiNarrative, 170)
    doc.text(lines, 20, y)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderSection(doc: any, title: string, y: number): number {
  if (y > 260) {
    doc.addPage()
    y = 20
  }
  doc.setFontSize(13)
  doc.setTextColor(50, 50, 50)
  doc.text(title, 14, y)
  y += 8
  doc.setTextColor(80, 80, 80)
  return y
}
