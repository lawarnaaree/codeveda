import { HttpError } from '../utils/HttpError.js'

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Sign in is required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action'))
    }

    next()
  }
}
