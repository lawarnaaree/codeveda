import { z } from 'zod'

const priceSchema = z.number()
  .finite()
  .nonnegative()
  .max(9_999_999_999.99)
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Price can have no more than two decimal places',
  })

export const idSchema = z.string().refine(
  (value) => /^[1-9]\d{0,18}$/.test(value)
    && BigInt(value) <= 9_223_372_036_854_775_807n,
  { message: 'ID must be a positive supported integer' },
)

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(64),
  category: z.string().trim().min(1).max(80),
  price: priceSchema,
  quantity: z.number().int().min(0).max(2_147_483_647),
  reorderLevel: z.number().int().min(0).max(2_147_483_647),
})

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    stockReason: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((product, context) => {
    const changedFields = Object.keys(product).filter((key) => key !== 'stockReason')

    if (changedFields.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'At least one product field must be provided',
      })
    }

    if (product.quantity !== undefined && !product.stockReason) {
      context.addIssue({
        code: 'custom',
        path: ['stockReason'],
        message: 'A reason is required when changing stock quantity',
      })
    }
  })

export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(80).default(''),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const productParamsSchema = z.object({
  id: idSchema,
})
