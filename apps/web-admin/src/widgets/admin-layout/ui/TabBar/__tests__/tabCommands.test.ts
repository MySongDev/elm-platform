import { describe, expect, it } from 'vitest'
import { getTabCommands } from '../tabCommands'

describe('tab context menu commands', () => {
  it('only shows reload when there is a single tab', () => {
    const commands = getTabCommands('contextmenu', {
      currentFixed: false,
      targetFixed: false,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: true,
      closableCount: 1,
    })

    expect(commands.map(item => item.command)).toEqual(['reload'])
  })

  it('hides close-left when there is no closable tab before the target tab', () => {
    const commands = getTabCommands('contextmenu', {
      currentFixed: false,
      targetFixed: false,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: false,
      closableCount: 1,
    })

    expect(commands.map(item => item.command)).not.toContain('close-left')
  })

  it('disables close-current when the target tab is not closable', () => {
    const closeCurrentCommand = getTabCommands('contextmenu', {
      currentFixed: false,
      targetFixed: false,
      currentClosable: true,
      targetClosable: false,
      firstNonFixed: true,
      lastNonFixed: false,
      onlyOneTab: false,
      closableCount: 1,
    }).find(item => item.command === 'close-current')

    expect(closeCurrentCommand?.disabled).toBe(true)
  })
})
