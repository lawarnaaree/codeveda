import { pool } from '../config/database.js'

export async function createStockMovement({
  productId,
  orderId,
  quantityChange,
  reason,
  actorId,
}, queryable = pool) {
  const result = await queryable.query(
    `INSERT INTO stock_movements
       (product_id, order_id, quantity_change, reason, actor_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id::text AS id, product_id::text AS "productId",
               order_id::text AS "orderId",
               quantity_change AS "quantityChange", reason,
               actor_id::text AS "actorId", created_at AS "createdAt"`,
    [productId, orderId ?? null, quantityChange, reason, actorId ?? null],
  )

  return result.rows[0]
}

export async function listStockMovements({ page, pageSize, productId }) {
  const offset = (page - 1) * pageSize
  const [movements, count] = await Promise.all([
    pool.query(
      `SELECT
         sm.id::text AS id,
         sm.product_id::text AS "productId",
         sm.order_id::text AS "orderId",
         p.name AS "productName",
         sm.quantity_change AS "quantityChange",
         sm.reason,
         sm.actor_id::text AS "actorId",
         u.name AS "actorName",
         sm.created_at AS "createdAt"
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       LEFT JOIN users u ON u.id = sm.actor_id
       WHERE ($1::bigint IS NULL OR sm.product_id = $1)
       ORDER BY sm.created_at DESC, sm.id DESC
       LIMIT $2 OFFSET $3`,
      [productId ?? null, pageSize, offset],
    ),
    pool.query(
      `SELECT count(*)::text AS total
       FROM stock_movements
       WHERE ($1::bigint IS NULL OR product_id = $1)`,
      [productId ?? null],
    ),
  ])

  return {
    items: movements.rows,
    total: count.rows[0].total,
  }
}
