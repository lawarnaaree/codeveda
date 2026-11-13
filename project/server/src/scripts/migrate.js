import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { pool } from '../config/database.js'

const migrationDirectory = fileURLToPath(new URL('../../migrations/', import.meta.url))

async function runMigrations() {
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const files = (await readdir(migrationDirectory))
      .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
      .sort()

    for (const name of files) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [name],
      )

      if (rowCount > 0) {
        continue
      }

      const sql = await readFile(path.join(migrationDirectory, name), 'utf8')
      await client.query('BEGIN')

      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
        await client.query('COMMIT')
        console.info(`Applied migration ${name}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }

    console.info('Database migrations are up to date')
  } finally {
    client.release()
  }
}

try {
  await runMigrations()
} catch (error) {
  console.error('Database migration failed', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
