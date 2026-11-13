import * as productModel from '../models/Product.js'
import * as stockMovementModel from '../models/StockMovement.js'
import { publishStockChanged } from '../sockets/utils/realtime.js'
import { HttpError } from '../utils/HttpError.js'
import { withTransaction } from './withTransaction.js'

export function listStockMovements(query) {
  return stockMovementModel.listStockMovements(query)
}

export async function createStockMovement(input, actorId) {
  const result = await withTransaction(async (client) => {
    const product = await productModel.findProductById(
      input.productId,
      client,
      { forUpdate: true },
    )
    if (!product || product.archivedAt) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'Product was not found')
    }

    const quantity = product.quantity + input.quantityChange
    if (quantity < 0) {
      throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Stock cannot be reduced below zero')
    }
    if (quantity > 2_147_483_647) {
      throw new HttpError(422, 'INVALID_QUANTITY', 'Stock exceeds the supported quantity')
    }

    const updatedProduct = await productModel.changeProductQuantity(
      input.productId,
      quantity,
      client,
    )
    const movement = await stockMovementModel.createStockMovement({
      ...input,
      actorId,
    }, client)

    return {
      movement,
      stock: { productId: updatedProduct.id, quantity: updatedProduct.quantity },
    }
  })

  publishStockChanged(result.stock)
  return result.movement
}
