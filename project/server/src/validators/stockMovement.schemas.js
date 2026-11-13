import { z } from 'zod'
import { idSchema } from './product.schemas.js'

export const createStockMovementSchema = z.object({
  productId: idSchema,
  quantityChange: z.number().int().min(-2_147_483_647).max(2_147_483_647).refine((value) => value !== 0, {
    message: 'Quantity change must not be zero',
  }),
  reason: z.string().trim().min(1).max(120),
})

export const listStockMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  productId: idSchema.optional(),
})
