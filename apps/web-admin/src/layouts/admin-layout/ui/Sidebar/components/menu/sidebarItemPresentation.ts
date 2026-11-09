export function getSidebarMenuTitleClass(options: {
  collapse: boolean
  hideWhenCollapsed: boolean
}) {
  return {
    'is-collapse': options.collapse && options.hideWhenCollapsed,
  }
}
