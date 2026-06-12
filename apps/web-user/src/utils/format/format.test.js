import { describe, expect, it } from 'vitest'

import { maskPhone } from './format'

describe('maskPhone', () => {
  it('masks the middle four digits of a valid mobile number', () => {
    expect(maskPhone('13812345678')).toBe('138****5678')
  })

  it('returns an empty string for empty input', () => {
    expect(maskPhone()).toBe('')
  })

  it('keeps non-standard phone numbers readable after normalization', () => {
    expect(maskPhone('400-800-1234')).toBe('4008001234')
  })
})
