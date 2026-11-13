import { z } from 'zod'
import { idSchema } from './product.schemas.js'

export const userParamsSchema = z.object({
  id: idSchema,
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'inventory_manager', 'warehouse_staff']),
})

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})
