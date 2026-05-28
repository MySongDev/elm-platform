import { describe, expect, it } from 'vitest'
import { getTabItemClass, isActiveTab, shouldNavigateTab } from '../tabPresentation'

describe('TabBarFromScratch presentation', () => {
  it('marks a tab active only when its fullPath matches the current route', () => {
    expect(isActiveTab('/dashboard', '/dashboard')).toBe(true)
    expect(isActiveTab('/dashboard?from=menu', '/dashboard')).toBe(false)
    expect(isActiveTab('/system/user', '/dashboard')).toBe(false)
  })

  it('builds stable tab item classes for active and fixed states', () => {
    expect(getTabItemClass({ active: true, fixed: true })).toEqual({
      'is-active': true,
      'is-fixed': true,
    })

    expect(getTabItemClass({ active: false, fixed: false })).toEqual({
      'is-active': false,
      'is-fixed': false,
    })
  })

  it('navigates only when the target tab is not already active', () => {
    expect(shouldNavigateTab('/system/user', '/dashboard')).toBe(true)
    expect(shouldNavigateTab('/dashboard', '/dashboard')).toBe(false)
  })
})
