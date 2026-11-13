// Validate environment settings and configure shared resources
import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error', error)
})

export async function connectDatabase() {
  await pool.query('SELECT 1')
  console.info('Connected to PostgreSQL')
}
