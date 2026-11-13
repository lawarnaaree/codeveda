import * as authService from '../services/auth.service.js'
import { env } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()))
  })
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()))
  })
}

export async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.validatedBody)
    res.status(201).json({ data: user })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const user = await authService.authenticateUser(req.validatedBody)
    if (!user) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect')
    }

    await regenerateSession(req)
    req.session.userId = user.id
    await saveSession(req)

    res.json({ data: user })
  } catch (error) {
    next(error)
  }
}

export async function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error)
    }

    res.clearCookie('stockroom.sid', {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
    })
    res.status(204).end()
  })
}

export function currentUser(req, res) {
  res.json({ data: req.user })
}
