import { Server } from 'socket.io'
import { findPublicUserById } from '../models/User.js'
import { env } from '../config/env.js'
import { setSocketServer } from './utils/realtime.js'

export function initializeSocketServer(httpServer, sessionMiddleware) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  })

  io.engine.use(sessionMiddleware)
  io.use(async (socket, next) => {
    try {
      const userId = socket.request.session?.userId
      if (!userId) {
        return next(new Error('Unauthorized'))
      }

      const user = await findPublicUserById(userId)
      if (!user || !user.isActive) {
        return next(new Error('Unauthorized'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      next(error)
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.user.id}`)
  })

  setSocketServer(io)
  return io
}
