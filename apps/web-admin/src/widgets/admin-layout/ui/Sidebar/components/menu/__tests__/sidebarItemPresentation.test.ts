import { describe, expect, it } from 'vitest'
import { getSidebarMenuTitleClass } from '../sidebarItemPresentation'

describe('sidebar item presentation', () => {
  it('keeps leaf titles visible for the collapsed menu tooltip', () => {
    expect(getSidebarMenuTitleClass({
      collapse: true,
      hideWhenCollapsed: false,
    }))
      .toEqual({ 'is-collapse': false })
  })

  it('hides submenu titles in the collapsed sidebar', () => {
    expect(getSidebarMenuTitleClass({
      collapse: true,
      hideWhenCollapsed: true,
    }))
      .toEqual({ 'is-collapse': true })
  })

  it('keeps titles visible when the sidebar is expanded', () => {
    expect(getSidebarMenuTitleClass({
      collapse: false,
      hideWhenCollapsed: true,
    }))
      .toEqual({ 'is-collapse': false })
  })
})
