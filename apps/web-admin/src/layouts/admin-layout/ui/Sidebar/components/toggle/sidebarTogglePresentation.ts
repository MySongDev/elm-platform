export interface SidebarTogglePresentation {
  ariaExpanded: boolean
  ariaLabel: string
  iconTransform: 'none' | 'rotateY(180deg)'
  tooltip: string
}

export function getSidebarTogglePresentation(
  collapsed: boolean,
): SidebarTogglePresentation {
  return collapsed
    ? {
        ariaExpanded: false,
        ariaLabel: '展开侧边栏',
        iconTransform: 'rotateY(180deg)',
        tooltip: '点击展开',
      }
    : {
        ariaExpanded: true,
        ariaLabel: '折叠侧边栏',
        iconTransform: 'none',
        tooltip: '点击折叠',
      }
}
