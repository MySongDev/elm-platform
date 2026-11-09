import { describe, expect, it } from 'vitest'
import { displayOrderLogRequestId } from './orderLogDisplay'

describe('order log display helpers', () => {
  it('shows requestId for traceable order action logs', () => {
    expect(displayOrderLogRequestId('req-admin-20260608')).toBe('req-admin-20260608')
  })

  it('uses a dash when requestId is missing or blank', () => {
    expect(displayOrderLogRequestId(null)).toBe('-')
    expect(displayOrderLogRequestId(undefined)).toBe('-')
    expect(displayOrderLogRequestId('   ')).toBe('-')
  })
})
