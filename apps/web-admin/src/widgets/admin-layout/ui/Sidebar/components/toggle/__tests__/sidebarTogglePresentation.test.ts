import { describe, expect, it } from 'vitest'
import { getSidebarTogglePresentation } from '../sidebarTogglePresentation'

describe('sidebar toggle presentation', () => {
  it('describes an expanded sidebar as collapsible', () => {
    expect(getSidebarTogglePresentation(false)).toEqual({
      ariaExpanded: true,
      ariaLabel: '折叠侧边栏',
      iconTransform: 'none',
      tooltip: '点击折叠',
    })
  })

  it('describes a collapsed sidebar as expandable', () => {
    expect(getSidebarTogglePresentation(true)).toEqual({
      ariaExpanded: false,
      ariaLabel: '展开侧边栏',
      iconTransform: 'rotateY(180deg)',
      tooltip: '点击展开',
    })
  })
})
