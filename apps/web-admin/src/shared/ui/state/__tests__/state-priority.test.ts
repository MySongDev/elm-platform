import { describe, expect, it } from 'vitest'
import { resolveAdminStateKind } from '../model/state'

describe('resolveAdminStateKind', () => {
  it('returns ready when no state flag is active', () => {
    expect(resolveAdminStateKind({})).toBe('ready')
  })

  it('returns empty when only empty is active', () => {
    expect(resolveAdminStateKind({ empty: true })).toBe('empty')
  })

  it('prioritizes error over empty', () => {
    expect(resolveAdminStateKind({
      error: new Error('failed'),
      empty: true,
    })).toBe('error')
  })

  it('treats an empty string error as an error state', () => {
    expect(resolveAdminStateKind({ error: '' })).toBe('error')
  })

  it('prioritizes loading over error and empty', () => {
    expect(resolveAdminStateKind({
      loading: true,
      error: new Error('failed'),
      empty: true,
    })).toBe('loading')
  })

  it('prioritizes forbidden over all other states', () => {
    expect(resolveAdminStateKind({
      forbidden: true,
      loading: true,
      error: new Error('failed'),
      empty: true,
    })).toBe('forbidden')
  })
})
