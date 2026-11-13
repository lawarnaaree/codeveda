import { pool } from '../config/database.js'

const productColumns = `
  id::text AS id,
  name,
  sku,
  category,
  price::text AS price,
  quantity,
  reorder_level AS "reorderLevel",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`

export async function listProducts({ search, page, pageSize }) {
  const offset = (page - 1) * pageSize
  const where = `archived_at IS NULL AND (
    $1 = ''
    OR name ILIKE '%' || $1 || '%'
    OR sku ILIKE '%' || $1 || '%'
    OR category ILIKE '%' || $1 || '%'
  )`
  const [products, count] = await Promise.all([
    pool.query(
      `SELECT ${productColumns}
       FROM products
       WHERE ${where}
       ORDER BY name ASC
       LIMIT $2 OFFSET $3`,
      [search, pageSize, offset],
    ),
    pool.query(`SELECT count(*)::text AS total FROM products WHERE ${where}`, [search]),
  ])

  return {
    items: products.rows,
    total: count.rows[0].total,
  }
}

export async function findProductById(id, queryable = pool, { forUpdate = false } = {}) {
  const result = await queryable.query(
    `SELECT ${productColumns}, archived_at AS "archivedAt"
     FROM products
     WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id],
  )

  return result.rows[0] ?? null
}

export async function findProductsForUpdate(ids, queryable) {
  const result = await queryable.query(
    `SELECT id::text AS id, name, price::text AS price, quantity
     FROM products
     WHERE id = ANY($1::bigint[]) AND archived_at IS NULL
     ORDER BY id
     FOR UPDATE`,
    [ids],
  )

  return result.rows
}

export async function createProduct(product, queryable = pool) {
  const result = await queryable.query(
    `INSERT INTO products
       (name, sku, category, price, quantity, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${productColumns}`,
    [
      product.name,
      product.sku,
      product.category,
      product.price,
      product.quantity,
      product.reorderLevel,
    ],
  )

  return result.rows[0]
}

export async function updateProduct(id, product, queryable = pool) {
  const columns = {
    name: 'name',
    sku: 'sku',
    category: 'category',
    price: 'price',
    quantity: 'quantity',
    reorderLevel: 'reorder_level',
  }
  const entries = Object.entries(columns)
    .filter(([key]) => product[key] !== undefined)
  const values = [id]
  const assignments = entries.map(([key, column]) => {
    values.push(product[key])
    return `${column} = $${values.length}`
  })

  assignments.push('updated_at = now()')

  const result = await queryable.query(
    `UPDATE products
     SET ${assignments.join(', ')}
     WHERE id = $1 AND archived_at IS NULL
     RETURNING ${productColumns}`,
    values,
  )

  return result.rows[0] ?? null
}

export async function archiveProduct(id, queryable = pool) {
  const result = await queryable.query(
    `UPDATE products
     SET archived_at = now(), updated_at = now()
     WHERE id = $1 AND archived_at IS NULL
     RETURNING id::text AS id`,
    [id],
  )

  return result.rowCount > 0
}

export async function changeProductQuantity(id, quantity, queryable) {
  const result = await queryable.query(
    `UPDATE products
     SET quantity = $2, updated_at = now()
     WHERE id = $1 AND archived_at IS NULL
     RETURNING id::text AS id, quantity`,
    [id, quantity],
  )

  return result.rows[0] ?? null
}
