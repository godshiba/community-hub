import { config } from 'dotenv'
import { join } from 'path'
import { app } from 'electron'

/**
 * Load .env from project root.
 * In dev, CWD is the project root. In production, use app resources path.
 */
export function loadEnv(): void {
  const envPath = app.isPackaged
    ? join(process.resourcesPath, '.env')
    : join(process.cwd(), '.env')

  config({ path: envPath })
}

export function getEnv(key: string): string | undefined {
  return process.env[key]
}

export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}
