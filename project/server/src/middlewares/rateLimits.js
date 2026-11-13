import rateLimit from 'express-rate-limit'

function createRateLimit(limit, windowMs) {
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests; try again later',
        },
      })
    },
  })
}

export const registrationRateLimit = createRateLimit(5, 60 * 60 * 1000)
export const loginRateLimit = createRateLimit(10, 15 * 60 * 1000)
