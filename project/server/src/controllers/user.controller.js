import * as userService from '../services/user.service.js'

export async function getUsers(req, res, next) {
  try {
    const result = await userService.listUsers(req.validatedQuery)
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

export async function patchUserRole(req, res, next) {
  try {
    const user = await userService.updateUserRole(
      req.validatedParams.id,
      req.validatedBody.role,
      req.user.id,
    )
    res.json({ data: user })
  } catch (error) {
    next(error)
  }
}
