import { HttpError } from '../utils/HttpError.js'

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'NOT_FOUND', 'The requested resource was not found'))
}
