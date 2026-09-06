import { describe, expect, it } from 'vitest'
import { getTabCommands } from '../tabCommands'

function state(partial: Partial<Parameters<typeof getTabCommands>[1]> = {}) {
  return {
    fixed: false,
    closable: true,
    firstNonFixed: false,
    lastNonFixed: false,
    onlyOneTab: false,
    closableCount: 2,
    ...partial,
  }
}

describe('tab context menu commands', () => {
  it('only shows reload when there is a single tab', () => {
    const commands = getTabCommands('contextmenu', state({
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: true,
      closableCount: 1,
    }))

    expect(commands.map(item => item.command)).toEqual(['reload'])
  })

  it('hides close-left when there is no closable tab before the target tab', () => {
    const commands = getTabCommands('contextmenu', state({
      firstNonFixed: true,
      lastNonFixed: true,
      closableCount: 1,
    }))

    expect(commands.map(item => item.command)).not.toContain('close-left')
  })

  it('disables close-current when the target tab is not closable', () => {
    const closeCurrentCommand = getTabCommands('contextmenu', state({
      closable: false,
      firstNonFixed: true,
      closableCount: 1,
    })).find(item => item.command === 'close-current')

    expect(closeCurrentCommand?.disabled).toBe(true)
  })

  it('disables close-current when the target tab is fixed', () => {
    const closeCurrentCommand = getTabCommands('contextmenu', state({
      fixed: true,
      closable: false,
    })).find(item => item.command === 'close-current')

    expect(closeCurrentCommand?.disabled).toBe(true)
  })
})
