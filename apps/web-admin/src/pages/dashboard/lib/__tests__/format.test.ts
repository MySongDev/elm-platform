import { describe, expect, it } from 'vitest'
import {
  formatDashboardCurrency,
  formatDashboardNumber,
  formatDashboardPercent,
  formatDashboardTrend,
} from '../format'

describe('dashboard format helpers', () => {
  it('formats large numbers with locale separators', () => {
    expect(formatDashboardNumber(12580)).toBe('12,580')
  })

  it('formats currency values with yuan prefix', () => {
    expect(formatDashboardCurrency(12580)).toBe('¥12,580')
  })

  it('formats percentage values with one decimal place', () => {
    expect(formatDashboardPercent(3.456)).toBe('3.5%')
  })

  it('formats positive, negative, and zero trends', () => {
    expect(formatDashboardTrend(12.3)).toBe('+12.3%')
    expect(formatDashboardTrend(-4.5)).toBe('-4.5%')
    expect(formatDashboardTrend(0)).toBe('0.0%')
  })
})
