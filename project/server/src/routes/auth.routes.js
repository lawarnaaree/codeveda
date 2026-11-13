import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { loginRateLimit, registrationRateLimit } from '../middlewares/rateLimits.js'
import { validateBody } from '../middlewares/validate.js'
import { loginSchema, registerSchema } from '../validators/auth.schemas.js'

export const authRoutes = Router()

authRoutes.post(
  '/register',
  registrationRateLimit,
  validateBody(registerSchema),
  authController.register,
)
authRoutes.post(
  '/login',
  loginRateLimit,
  validateBody(loginSchema),
  authController.login,
)
authRoutes.post('/logout', requireAuth, authController.logout)
authRoutes.get('/me', requireAuth, authController.currentUser)
