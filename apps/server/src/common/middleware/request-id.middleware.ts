import { randomUUID } from 'node:crypto'

export interface RequestIdRequestLike {
  headers?: Record<string, string | string[] | undefined>
  requestId?: string
}

export interface RequestIdResponseLike {
  setHeader?: (name: string, value: string) => void
}

export type RequestIdNext = () => void

export function requestIdMiddleware(
  request: RequestIdRequestLike,
  response: RequestIdResponseLike,
  next: RequestIdNext,
) {
  const requestId = resolveRequestId(request.headers?.['x-request-id'])

  request.requestId = requestId
  response.setHeader?.('x-request-id', requestId)

  next()
}

function resolveRequestId(value: string | string[] | undefined): string {
  const headerValue = Array.isArray(value) ? value[0] : value
  const normalized = headerValue?.trim()

  return normalized || randomUUID()
}
