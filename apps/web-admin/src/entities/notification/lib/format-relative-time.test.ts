import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './format-relative-time'

const base = new Date('2026-06-20T12:00:00.000Z')

describe('formatRelativeTime', () => {
  it('returns empty string for invalid ISO', () => {
    expect(formatRelativeTime('nope', 'zh-CN', base)).toBe('')
  })

  it('returns 刚刚 when less than 1 minute', () => {
    const iso = new Date(base.getTime() - 30_000).toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('刚刚')
  })

  it('returns X 分钟前 when less than 1 hour', () => {
    const iso = new Date(base.getTime() - 10 * 60_000).toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('10 分钟前')
  })

  it('returns X 小时前 when same day', () => {
    const iso = new Date(base.getTime() - 3 * 60 * 60_000).toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('3 小时前')
  })

  it('returns X 天前 when within 7 days', () => {
    const twoDaysAgo = new Date(base.getTime() - 2 * 24 * 60 * 60_000)
    const iso = twoDaysAgo.toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('2 天前')
  })

  it('returns MM-DD when same year but over 7 days', () => {
    const iso = new Date('2026-06-01T08:00:00.000Z').toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('06-01')
  })

  it('returns YYYY-MM-DD when different year', () => {
    const iso = new Date('2025-12-25T08:00:00.000Z').toISOString()
    expect(formatRelativeTime(iso, 'zh-CN', base)).toBe('2025-12-25')
  })
})
