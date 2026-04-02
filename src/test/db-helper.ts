import Database from 'better-sqlite3'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { vi } from 'vitest'

let testDb: Database.Database | null = null

/**
 * Create a fresh in-memory SQLite database with all migrations applied.
 * Mocks `getDatabase()` from database.service to return this instance.
 */
export function createTestDatabase(): Database.Database {
  testDb = new Database(':memory:')
  testDb.pragma('journal_mode = WAL')
  testDb.pragma('foreign_keys = ON')

  // Create migrations tracking table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Run all migrations
  const migrationsDir = join(process.cwd(), 'src/main/migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    testDb.exec(sql)
    testDb.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
  }

  return testDb
}

/**
 * Close and discard the test database.
 */
export function closeTestDatabase(): void {
  if (testDb) {
    testDb.close()
    testDb = null
  }
}

/**
 * Get the current test database instance.
 */
export function getTestDb(): Database.Database {
  if (!testDb) throw new Error('Test database not initialized — call createTestDatabase() first')
  return testDb
}

/**
 * Mock the database.service module to use the test database.
 * Call this in beforeEach with the db instance from createTestDatabase().
 */
export function mockDatabaseService(db: Database.Database): void {
  vi.doMock('@main/services/database.service', () => ({
    getDatabase: () => db,
    initDatabase: () => db,
    closeDatabase: () => {}
  }))
}
