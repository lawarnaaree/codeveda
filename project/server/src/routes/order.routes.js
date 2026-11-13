import { Router } from 'express'
import * as orderController from '../controllers/order.controller.js'
import { authorize } from '../middlewares/authorize.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.js'
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  updateOrderStatusSchema,
} from '../validators/order.schemas.js'

export const orderRoutes = Router()

orderRoutes.use(requireAuth)
orderRoutes.get('/', validateQuery(listOrdersQuerySchema), orderController.getOrders)
orderRoutes.post('/', validateBody(createOrderSchema), orderController.postOrder)
orderRoutes.patch(
  '/:id/status',
  authorize('admin', 'inventory_manager'),
  validateParams(orderParamsSchema),
  validateBody(updateOrderStatusSchema),
  orderController.patchOrderStatus,
)
