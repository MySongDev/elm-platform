const BASE_DELAY_MS = 300

export function isRetryableError(error) {
  const code = error?.code
  const status = error?.response?.status

  return (
    code === 'ECONNABORTED'
    || code === 'ERR_NETWORK'
    || status === 429
    || (typeof status === 'number' && status >= 500)
  )
}

export function calcRetryDelayMs(attempt) {
  const exp = BASE_DELAY_MS * 2 ** (attempt - 1)
  const jitter = Math.floor(Math.random() * exp)

  return exp + jitter
}
