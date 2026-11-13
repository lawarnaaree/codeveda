const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const pageSize = 100

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error(
      'Cannot reach the Stockroom API. Check the server connection and retry.',
      { cause: error },
    )
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed (${response.status})`,
      response.status,
      payload?.error?.code,
    )
  }

  return payload
}

export async function apiListAll(path, { signal } = {}) {
  const items = []
  let total = Number.POSITIVE_INFINITY

  for (let page = 1; items.length < total; page += 1) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const payload = await apiRequest(`${path}?${query}`, { signal })
    const nextItems = payload?.data
    const nextTotal = Number(payload?.pagination?.total)

    if (!Array.isArray(nextItems) || !Number.isSafeInteger(nextTotal) || nextTotal < 0) {
      throw new Error('The API returned an invalid paginated response.')
    }
    if (nextItems.length === 0 && items.length < nextTotal) {
      throw new Error('The API returned an incomplete paginated response.')
    }

    items.push(...nextItems)
    total = nextTotal
  }

  return items
}
