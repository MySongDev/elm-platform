import { describe, expect, it } from 'vitest'
import { getMaxScrollLeft, getScrollDistance, getScrollState } from '../tabScroll'

describe('tabBarFromScratch scroll helpers', () => {
  it('keeps max scroll left at or above zero', () => {
    expect(getMaxScrollLeft(300, 500)).toBe(0)
    expect(getMaxScrollLeft(900, 500)).toBe(400)
  })

  it('derives overflow and edge availability from scroll metrics', () => {
    expect(getScrollState({
      scrollLeft: 0,
      scrollWidth: 900,
      clientWidth: 500,
    })).toEqual({
      isOverflow: true,
      canScrollLeft: false,
      canScrollRight: true,
    })

    expect(getScrollState({
      scrollLeft: 400,
      scrollWidth: 900,
      clientWidth: 500,
    })).toEqual({
      isOverflow: true,
      canScrollLeft: true,
      canScrollRight: false,
    })
  })

  it('uses at least the minimum scroll distance', () => {
    expect(getScrollDistance(200)).toBe(220)
    expect(getScrollDistance(800)).toBe(480)
  })
})
