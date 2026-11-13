import { env } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'

const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function requireTrustedOrigin(req, _res, next) {
  if (!stateChangingMethods.has(req.method)) {
    return next()
  }

  if (req.get('origin') !== env.clientOrigin) {
    return next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed'))
  }

  next()
}
