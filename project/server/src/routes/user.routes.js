import { Router } from 'express'
import * as userController from '../controllers/user.controller.js'
import { authorize } from '../middlewares/authorize.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.js'
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  userParamsSchema,
} from '../validators/user.schemas.js'

export const userRoutes = Router()

userRoutes.use(requireAuth, authorize('admin'))
userRoutes.get('/', validateQuery(listUsersQuerySchema), userController.getUsers)
userRoutes.patch(
  '/:id/role',
  validateParams(userParamsSchema),
  validateBody(updateUserRoleSchema),
  userController.patchUserRole,
)
