import type { RequestIdRequestLike } from './request-id.middleware'
import { requestIdMiddleware } from './request-id.middleware'

describe('requestIdMiddleware', () => {
  function createResponse() {
    return {
      setHeader: jest.fn(),
    }
  }

  it('reuses incoming x-request-id header', () => {
    const request: RequestIdRequestLike = {
      headers: {
        'x-request-id': 'client-request-123',
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toBe('client-request-123')
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'client-request-123')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('uses the first x-request-id header value when header is an array', () => {
    const request: RequestIdRequestLike = {
      headers: {
        'x-request-id': ['first-request-id', 'second-request-id'],
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toBe('first-request-id')
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'first-request-id')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('generates a UUID requestId when header is missing', () => {
    const request: RequestIdRequestLike = {
      headers: {},
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toEqual(expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ))
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', request.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('generates a UUID requestId when header is blank', () => {
    const request: RequestIdRequestLike = {
      headers: {
        'x-request-id': '   ',
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toEqual(expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ))
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', request.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })
})
