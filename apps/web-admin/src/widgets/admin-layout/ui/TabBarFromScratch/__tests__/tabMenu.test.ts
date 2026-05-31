import { describe, expect, it } from 'vitest'
import { getContextMenuPosition } from '../tabMenu'

describe('tabBarFromScratch context menu helpers', () => {
  it('keeps the menu inside the viewport with a gap', () => {
    expect(getContextMenuPosition({
      clientX: 790,
      clientY: 590,
      viewportWidth: 800,
      viewportHeight: 600,
      menuWidth: 148,
      menuHeight: 208,
      gap: 8,
    })).toEqual({
      x: 644,
      y: 384,
    })
  })

  it('keeps the menu away from the top-left viewport edge', () => {
    expect(getContextMenuPosition({
      clientX: 2,
      clientY: 3,
      viewportWidth: 800,
      viewportHeight: 600,
      menuWidth: 148,
      menuHeight: 208,
      gap: 8,
    })).toEqual({
      x: 8,
      y: 8,
    })
  })
})
