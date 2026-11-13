import { pool } from '../config/database.js'

const publicUserColumns = `
  id::text AS id,
  name,
  email,
  role,
  is_active AS "isActive",
  created_at AS "createdAt"
`

export async function findUserForLogin(email) {
  const result = await pool.query(
    `SELECT id::text AS id, name, email, password_hash AS "passwordHash",
            role, is_active AS "isActive"
     FROM users
     WHERE email = $1`,
    [email],
  )

  return result.rows[0] ?? null
}

export async function findPublicUserById(id, queryable = pool) {
  const result = await queryable.query(
    `SELECT ${publicUserColumns}
     FROM users
     WHERE id = $1`,
    [id],
  )

  return result.rows[0] ?? null
}

export async function createUser({ name, email, passwordHash }, queryable = pool) {
  const result = await queryable.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'warehouse_staff')
     RETURNING ${publicUserColumns}`,
    [name, email, passwordHash],
  )

  return result.rows[0]
}

export async function listUsers({ page, pageSize }) {
  const offset = (page - 1) * pageSize
  const [users, count] = await Promise.all([
    pool.query(
      `SELECT ${publicUserColumns}
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    pool.query('SELECT count(*)::text AS total FROM users'),
  ])

  return {
    items: users.rows,
    total: count.rows[0].total,
  }
}

export async function updateUserRole(id, role, queryable) {
  const result = await queryable.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1
     RETURNING ${publicUserColumns}`,
    [id, role],
  )

  return result.rows[0] ?? null
}
