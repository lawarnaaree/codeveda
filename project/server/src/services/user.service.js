import * as userModel from '../models/User.js'
import { HttpError } from '../utils/HttpError.js'
import { withTransaction } from './withTransaction.js'

export function listUsers(query) {
  return userModel.listUsers(query)
}

export async function updateUserRole(id, role, actingUserId) {
  return withTransaction(async (client) => {
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE')

    const current = await userModel.findPublicUserById(id, client)
    if (!current) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User was not found')
    }
    if (id === actingUserId && current.role !== role) {
      throw new HttpError(409, 'SELF_ROLE_CHANGE', 'You cannot change your own role')
    }

    if (current.role === 'admin' && current.isActive && role !== 'admin') {
      const admins = await client.query(
        `SELECT count(*)::int AS count
         FROM users
         WHERE role = 'admin' AND is_active = TRUE`,
      )
      if (admins.rows[0].count <= 1) {
        throw new HttpError(409, 'LAST_ADMIN', 'The last active administrator cannot be demoted')
      }
    }

    return userModel.updateUserRole(id, role, client)
  })
}
