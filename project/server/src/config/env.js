import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1),
    CLIENT_ORIGIN: z.string().url(),
    SESSION_SECRET: z.string().min(32),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
    throw new Error(`Invalid server configuration: ${parsed.error.message}`)
}

export const env = {
    port: parsed.data.PORT,
    nodeEnv: parsed.data.NODE_ENV,
    databaseUrl: parsed.data.DATABASE_URL,
    clientOrigin: parsed.data.CLIENT_ORIGIN,
    sessionSecret: parsed.data.SESSION_SECRET,
    trustProxyHops: parsed.data.TRUST_PROXY_HOPS ?? 0,
}