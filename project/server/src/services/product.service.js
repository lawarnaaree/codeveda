import * as productModel from '../models/Product.js'
import { createStockMovement } from '../models/StockMovement.js'
import { publishStockChanged } from '../sockets/utils/realtime.js'
import { HttpError } from '../utils/HttpError.js'
import { withTransaction } from './withTransaction.js'

export function listProducts(query) {
  return productModel.listProducts(query)
}

export async function createProduct(input, actorId) {
  const product = await withTransaction(async (client) => {
    const created = await productModel.createProduct({
      ...input,
      sku: input.sku.toUpperCase(),
    }, client)

    if (created.quantity > 0) {
      await createStockMovement({
        productId: created.id,
        quantityChange: created.quantity,
        reason: 'initial_stock',
        actorId,
      }, client)
    }

    return created
  })

  if (product.quantity > 0) {
    publishStockChanged({ productId: product.id, quantity: product.quantity })
  }

  return product
}

export async function updateProduct(id, input, actorId) {
  const result = await withTransaction(async (client) => {
    const current = await productModel.findProductById(id, client, { forUpdate: true })
    if (!current || current.archivedAt) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found')
    }

    const { stockReason, ...changes } = input
    const updated = await productModel.updateProduct(id, {
      ...changes,
      ...(changes.sku ? { sku: changes.sku.toUpperCase() } : {}),
    }, client)

    if (changes.quantity !== undefined && changes.quantity !== current.quantity) {
      await createStockMovement({
        productId: id,
        quantityChange: changes.quantity - current.quantity,
        reason: stockReason,
        actorId,
      }, client)
    }

    return {
      product: updated,
      stock: changes.quantity === undefined || changes.quantity === current.quantity
        ? null
        : { productId: updated.id, quantity: updated.quantity },
    }
  })

  if (result.stock) {
    publishStockChanged(result.stock)
  }

  return result.product
}

export async function archiveProduct(id) {
  const archived = await productModel.archiveProduct(id)
  if (!archived) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found')
  }
}
