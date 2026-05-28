interface TabItemClassOptions {
  active: boolean
  fixed: boolean
}

export function isActiveTab(tabFullPath: string, currentFullPath: string): boolean {
  return tabFullPath === currentFullPath
}

export function shouldNavigateTab(tabFullPath: string, currentFullPath: string): boolean {
  return !isActiveTab(tabFullPath, currentFullPath)
}

export function shouldShowCloseButton(tabClosable: boolean, totalTabs: number): boolean {
  return tabClosable && totalTabs > 1
}

export function getTabItemClass(options: TabItemClassOptions) {
  return {
    'is-active': options.active,
    'is-fixed': options.fixed,
  }
}
