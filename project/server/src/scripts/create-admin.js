import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { pool } from '../config/database.js'

const credentialsSchema = z.object({
  BOOTSTRAP_ADMIN_EMAIL: z.string().trim().email().max(254),
  BOOTSTRAP_ADMIN_PASSWORD: z.string()
    .min(12)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72),
})

async function createFirstAdmin() {
  const parsed = credentialsSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error('Set a valid BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in the server environment')
  }

  const email = parsed.data.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
  const passwordHash = await bcrypt.hash(parsed.data.BOOTSTRAP_ADMIN_PASSWORD, 12)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE')

    const admins = await client.query(
      `SELECT count(*)::int AS count
       FROM users
       WHERE role = 'admin'`,
    )
    if (admins.rows[0].count > 0) {
      throw new Error('An administrator already exists; refusing to bootstrap another')
    }

    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Stockroom Administrator', $1, $2, 'admin')`,
      [email, passwordHash],
    )
    await client.query('COMMIT')
    console.info('Initial administrator created. Remove the bootstrap credentials from the environment.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

try {
  await createFirstAdmin()
} catch (error) {
  console.error('Administrator bootstrap failed', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
