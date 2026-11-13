import { pool } from '../config/database.js'

export async function withTransaction(operation) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        'The database operation and its rollback both failed',
        { cause: error },
      )
    }

    throw error
  } finally {
    client.release()
  }
}
