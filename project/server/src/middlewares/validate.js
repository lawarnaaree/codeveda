import { HttpError } from '../utils/HttpError.js'

function validate(schema, source, target) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return next(new HttpError(
        422,
        'VALIDATION_ERROR',
        `Invalid request ${source}`,
        result.error.flatten(),
      ))
    }

    req[target] = result.data
    next()
  }
}

export const validateBody = (schema) => validate(schema, 'body', 'validatedBody')
export const validateQuery = (schema) => validate(schema, 'query', 'validatedQuery')
export const validateParams = (schema) => validate(schema, 'params', 'validatedParams')
