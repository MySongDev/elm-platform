interface ContextMenuPositionOptions {
  clientX: number
  clientY: number
  viewportWidth: number
  viewportHeight: number
  menuWidth: number
  menuHeight: number
  gap: number
}

export function getContextMenuPosition(options: ContextMenuPositionOptions) {
  const maxLeft = options.viewportWidth - options.menuWidth - options.gap
  const maxTop = options.viewportHeight - options.menuHeight - options.gap

  return {
    x: Math.max(options.gap, Math.min(options.clientX, maxLeft)),
    y: Math.max(options.gap, Math.min(options.clientY, maxTop)),
  }
}
