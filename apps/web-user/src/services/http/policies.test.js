import { describe, expect, it } from 'vitest'
import { isBusinessError } from './policies'

describe('http policies', () => {
  it('does not treat entity status fields as business errors', () => {
    expect(isBusinessError({
      id: 3269,
      name: 'shop 3269',
      status: 0,
      rating: 5,
    })).toBe(false)
  })

  it('still treats status error envelopes as business errors', () => {
    expect(isBusinessError({
      status: 0,
      message: 'invalid params',
    })).toBe(true)
  })

  it('does not treat captcha image code as a business error code', () => {
    expect(isBusinessError({
      status: 1,
      code: 'data:image/png;base64,abc',
    })).toBe(false)
  })

  it('still treats string code envelopes with messages as business errors', () => {
    expect(isBusinessError({
      code: 'INVALID_CAPTCHA',
      message: '验证码错误',
    })).toBe(true)
  })
})
