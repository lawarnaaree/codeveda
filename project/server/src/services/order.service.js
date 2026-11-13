import * as orderModel from '../models/Order.js'
import * as productModel from '../models/Product.js'
import { createStockMovement } from '../models/StockMovement.js'
import { publishOrderCreated, publishStockChanged } from '../sockets/utils/realtime.js'
import { HttpError } from '../utils/HttpError.js'
import { withTransaction } from './withTransaction.js'

export function listOrders(query) {
  return orderModel.listOrders(query)
}

export async function createOrder(input, actorId) {
  const { order, stockChanges } = await withTransaction(async (client) => {
    const productIds = input.items
      .map((item) => item.productId)
      .sort((left, right) => {
        const leftId = BigInt(left)
        const rightId = BigInt(right)
        return leftId < rightId ? -1 : leftId > rightId ? 1 : 0
      })
    const products = await productModel.findProductsForUpdate(productIds, client)
    if (products.length !== productIds.length) {
      throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more products were not found')
    }

    const productsById = new Map(products.map((product) => [product.id, product]))
    for (const item of input.items) {
      if (productsById.get(item.productId).quantity < item.quantity) {
        throw new HttpError(
          409,
          'INSUFFICIENT_STOCK',
          `Insufficient stock for product ${item.productId}`,
        )
      }
    }

    const createdOrder = await orderModel.createOrderRecord({
      customerName: input.customerName,
      createdBy: actorId,
    }, client)
    const changes = []

    for (const item of input.items) {
      const product = productsById.get(item.productId)
      const updatedProduct = await productModel.changeProductQuantity(
        item.productId,
        product.quantity - item.quantity,
        client,
      )

      await orderModel.createOrderItem({
        orderId: createdOrder.id,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      }, client)

      await createStockMovement({
        productId: product.id,
        orderId: createdOrder.id,
        quantityChange: -item.quantity,
        reason: 'order',
        actorId,
      }, client)

      changes.push({
        productId: updatedProduct.id,
        quantity: updatedProduct.quantity,
      })
    }

    await orderModel.updateOrderTotal(createdOrder.id, client)
    return {
      order: await orderModel.findOrderById(createdOrder.id, client),
      stockChanges: changes,
    }
  })

  publishOrderCreated({ orderId: order.id })
  for (const change of stockChanges) {
    publishStockChanged(change)
  }

  return order
}
