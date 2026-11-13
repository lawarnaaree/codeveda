import { findPublicUserById } from '../models/User.js'
import { HttpError } from '../utils/HttpError.js'

export async function requireAuth(req, _res, next) {
  try {
    const userId = req.session?.userId
    if (!userId) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in is required')
    }

    const user = await findPublicUserById(userId)
    if (!user || !user.isActive) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in is required')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
