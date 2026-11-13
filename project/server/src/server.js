import { createServer } from 'node:http'
import { app, sessionMiddleware } from './app.js'
import { connectDatabase, pool } from './config/database.js'
import { env } from './config/env.js'
import { initializeSocketServer } from './sockets/index.js'

async function start() {
  await connectDatabase()

  const httpServer = createServer(app)
  const io = initializeSocketServer(httpServer, sessionMiddleware)

  await new Promise((resolve, reject) => {
    httpServer.once('error', reject)
    httpServer.listen(env.port, () => {
      httpServer.off('error', reject)
      resolve()
    })
  })

  console.info(`API listening on port ${env.port}`)

  let stopping = false
  const stop = () => {
    if (stopping) {
      return
    }

    stopping = true
    io.close(async () => {
      try {
        await pool.end()
      } catch (error) {
        console.error('Failed to close PostgreSQL pool cleanly', error)
        process.exitCode = 1
      }
    })
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

start().catch(async (error) => {
  console.error('Server startup failed', error)
  process.exitCode = 1

  try {
    await pool.end()
  } catch (closeError) {
    console.error('Failed to close PostgreSQL pool after startup error', closeError)
  }
})
