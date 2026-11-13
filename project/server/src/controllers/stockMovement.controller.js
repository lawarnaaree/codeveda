import * as stockMovementService from '../services/stockMovement.service.js'

export async function getStockMovements(req, res, next) {
  try {
    const result = await stockMovementService.listStockMovements(req.validatedQuery)
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

export async function postStockMovement(req, res, next) {
  try {
    const movement = await stockMovementService.createStockMovement(
      req.validatedBody,
      req.user.id,
    )
    res.status(201).json({ data: movement })
  } catch (error) {
    next(error)
  }
}
