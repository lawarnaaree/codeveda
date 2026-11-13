import { Router } from 'express'
import * as stockMovementController from '../controllers/stockMovement.controller.js'
import { authorize } from '../middlewares/authorize.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody, validateQuery } from '../middlewares/validate.js'
import {
  createStockMovementSchema,
  listStockMovementsQuerySchema,
} from '../validators/stockMovement.schemas.js'

export const stockMovementRoutes = Router()

stockMovementRoutes.use(requireAuth, authorize('admin', 'inventory_manager'))
stockMovementRoutes.get(
  '/',
  validateQuery(listStockMovementsQuerySchema),
  stockMovementController.getStockMovements,
)
stockMovementRoutes.post(
  '/',
  validateBody(createStockMovementSchema),
  stockMovementController.postStockMovement,
)
