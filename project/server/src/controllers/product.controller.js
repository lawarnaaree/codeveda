import * as productService from '../services/product.service.js'

export async function getProducts(req, res, next) {
  try {
    const result = await productService.listProducts(req.validatedQuery)
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

export async function postProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.validatedBody, req.user.id)
    res.status(201).json({ data: product })
  } catch (error) {
    next(error)
  }
}

export async function patchProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(
      req.validatedParams.id,
      req.validatedBody,
      req.user.id,
    )
    res.json({ data: product })
  } catch (error) {
    next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    await productService.archiveProduct(req.validatedParams.id)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
