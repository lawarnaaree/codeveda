import { Router } from 'express'
import * as productController from '../controllers/product.controller.js'
import { authorize } from '../middlewares/authorize.js'
import { requireAuth } from '../middlewares/requireAuth.js'
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.js'
import {
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  updateProductSchema,
} from '../validators/product.schemas.js'

export const productRoutes = Router()

productRoutes.use(requireAuth)
productRoutes.get('/', validateQuery(listProductsQuerySchema), productController.getProducts)
productRoutes.post(
  '/',
  authorize('admin', 'inventory_manager'),
  validateBody(createProductSchema),
  productController.postProduct,
)
productRoutes.patch(
  '/:id',
  authorize('admin', 'inventory_manager'),
  validateParams(productParamsSchema),
  validateBody(updateProductSchema),
  productController.patchProduct,
)
productRoutes.delete(
  '/:id',
  authorize('admin', 'inventory_manager'),
  validateParams(productParamsSchema),
  productController.deleteProduct,
)
