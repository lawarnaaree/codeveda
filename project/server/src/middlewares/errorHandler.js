const databaseErrorResponses = {
  '23505': {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'A record with the supplied unique value already exists',
  },
  '23503': {
    statusCode: 409,
    code: 'CONFLICT',
    message: 'The request conflicts with related records',
  },
  '23514': {
    statusCode: 422,
    code: 'CONSTRAINT_VIOLATION',
    message: 'The request violates a data constraint',
  },
}

const requestErrorResponses = {
  'entity.parse.failed': {
    statusCode: 400,
    code: 'INVALID_JSON',
    message: 'Request body must contain valid JSON',
  },
  'entity.too.large': {
    statusCode: 413,
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Request body is too large',
  },
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  const databaseResponse = databaseErrorResponses[error.code]
  const requestResponse = requestErrorResponses[error.type]
  const statusCode = databaseResponse?.statusCode
    ?? requestResponse?.statusCode
    ?? error.statusCode
    ?? error.status
    ?? 500
  const code = statusCode >= 500
    ? 'INTERNAL_ERROR'
    : databaseResponse?.code
      ?? requestResponse?.code
      ?? error.code
      ?? 'REQUEST_ERROR'
  const message = databaseResponse?.message
    ?? requestResponse?.message
    ?? (statusCode < 500 ? error.message : 'An unexpected server error occurred')

  if (statusCode >= 500) {
    console.error('Request failed', error)
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(error.details ? { details: error.details } : {}),
    },
  })
}
