import { z } from 'zod'

const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase())
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must not exceed 72 UTF-8 bytes',
  })

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must not exceed 72 UTF-8 bytes',
  }),
})
