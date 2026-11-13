import { Router } from 'express'
import * as orderController from '../controllers/order.controller.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody, validateQuery } from '../middlewares/validate.js'
import { createOrderSchema, listOrdersQuerySchema } from '../validators/order.schemas.js'

export const orderRoutes = Router()

orderRoutes.use(requireAuth)
orderRoutes.get('/', validateQuery(listOrdersQuerySchema), orderController.getOrders)
orderRoutes.post('/', validateBody(createOrderSchema), orderController.postOrder)
