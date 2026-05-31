import { describe, expect, it } from 'vitest'
import { getTabCommands } from '../tabCommands'

describe('tabBarFromScratch commands', () => {
  it('only shows reload when there is a single tab', () => {
    const commands = getTabCommands('dropdown', {
      currentFixed: false,
      currentClosable: false,
      targetFixed: false,
      targetClosable: false,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: true,
      closableCount: 0,
    })

    expect(commands.map(item => item.command)).toEqual(['reload'])
  })

  it('disables close-current when the current tab is fixed or not closable', () => {
    const fixedCurrent = getTabCommands('dropdown', {
      currentFixed: true,
      currentClosable: false,
      targetFixed: true,
      targetClosable: false,
      firstNonFixed: true,
      lastNonFixed: false,
      onlyOneTab: false,
      closableCount: 2,
    }).find(item => item.command === 'close-current')

    expect(fixedCurrent?.disabled).toBe(true)
  })

  it('disables close-others when there is only one closable tab', () => {
    const closeOthers = getTabCommands('dropdown', {
      currentFixed: false,
      currentClosable: true,
      targetFixed: false,
      targetClosable: true,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: false,
      closableCount: 1,
    }).find(item => item.command === 'close-others')

    expect(closeOthers?.disabled).toBe(true)
  })

  it('hides close-left in context menu when there is no closable tab before target', () => {
    const commands = getTabCommands('contextmenu', {
      currentFixed: false,
      currentClosable: true,
      targetFixed: false,
      targetClosable: true,
      firstNonFixed: true,
      lastNonFixed: false,
      onlyOneTab: false,
      closableCount: 2,
    })

    expect(commands.map(item => item.command)).not.toContain('close-left')
  })
})
