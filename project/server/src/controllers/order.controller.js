import * as orderService from '../services/order.service.js'

export async function getOrders(req, res, next) {
  try {
    const result = await orderService.listOrders(req.validatedQuery)
    res.json({
      data: result.items,
      pagination: {
        page: req.validatedQuery.page,
        pageSize: req.validatedQuery.pageSize,
        total: result.total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function postOrder(req, res, next) {
  try {
    const order = await orderService.createOrder(req.validatedBody, req.user.id)
    res.status(201).json({ data: order })
  } catch (error) {
    next(error)
  }
}

export async function patchOrderStatus(req, res, next) {
  try {
    const order = await orderService.updateOrderStatus(
      req.validatedParams.id,
      req.validatedBody.status,
    )
    res.json({ data: order })
  } catch (error) {
    next(error)
  }
}
