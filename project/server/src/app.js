import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { env } from './config/env.js'
import { pool } from './config/database.js'
import { requireTrustedOrigin } from './middlewares/requireTrustedOrigin.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFound } from './middlewares/notFound.js'
import { authRoutes } from './routes/auth.routes.js'
import { orderRoutes } from './routes/order.routes.js'
import { productRoutes } from './routes/product.routes.js'
import { stockMovementRoutes } from './routes/stockMovement.routes.js'
import { userRoutes } from './routes/user.routes.js'

export const app = express()
const PgSessionStore = connectPgSimple(session)

if (env.trustProxyHops > 0) {
  app.set('trust proxy', env.trustProxyHops)
}

export const sessionMiddleware = session({
  name: 'stockroom.sid',
  store: new PgSessionStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  },
})

app.use(helmet())
app.use(cors({
  origin: env.clientOrigin,
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(requireTrustedOrigin)
app.use(sessionMiddleware)

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/stock-movements', stockMovementRoutes)
app.use('/api/users', userRoutes)

app.use(notFound)
app.use(errorHandler)
