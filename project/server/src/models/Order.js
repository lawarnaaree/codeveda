import { pool } from '../config/database.js'

const orderSelect = `
  SELECT
    o.id::text AS id,
    o.customer_name AS "customerName",
    o.total::text AS total,
    o.status,
    o.created_by::text AS "createdBy",
    o.created_at AS "createdAt",
    COALESCE(
      json_agg(
        json_build_object(
          'productId', oi.product_id::text,
          'productName', oi.product_name_at_sale,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price::text
        )
        ORDER BY oi.id
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::json
    ) AS items
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
`

export async function listOrders({ page, pageSize }) {
  const offset = (page - 1) * pageSize
  const [orders, count] = await Promise.all([
    pool.query(
      `${orderSelect}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    pool.query('SELECT count(*)::text AS total FROM orders'),
  ])

  return {
    items: orders.rows,
    total: count.rows[0].total,
  }
}

export async function createOrderRecord({ customerName, createdBy }, queryable) {
  const result = await queryable.query(
    `INSERT INTO orders (customer_name, status, created_by)
     VALUES ($1, 'Processing', $2)
     RETURNING id::text AS id`,
    [customerName, createdBy],
  )

  return result.rows[0]
}

export async function createOrderItem({
  orderId,
  productId,
  productName,
  quantity,
  unitPrice,
}, queryable) {
  await queryable.query(
    `INSERT INTO order_items
       (order_id, product_id, product_name_at_sale, quantity, unit_price)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, productId, productName, quantity, unitPrice],
  )
}

export async function updateOrderTotal(orderId, queryable) {
  await queryable.query(
    `UPDATE orders
     SET total = (
       SELECT COALESCE(sum(unit_price * quantity), 0)
       FROM order_items
       WHERE order_id = $1
     )
     WHERE id = $1`,
    [orderId],
  )
}

export async function findOrderById(id, queryable) {
  const result = await queryable.query(
    `${orderSelect}
     WHERE o.id = $1
     GROUP BY o.id`,
    [id],
  )

  return result.rows[0] ?? null
}
