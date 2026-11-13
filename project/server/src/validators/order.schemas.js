import { z } from 'zod'
import { idSchema } from './product.schemas.js'

const orderItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().min(1).max(2_147_483_647),
})

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  items: z.array(orderItemSchema).min(1).max(100),
}).superRefine((order, context) => {
  const productIds = order.items.map((item) => item.productId)
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['items'],
      message: 'Each product may appear only once in an order',
    })
  }
})

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})
