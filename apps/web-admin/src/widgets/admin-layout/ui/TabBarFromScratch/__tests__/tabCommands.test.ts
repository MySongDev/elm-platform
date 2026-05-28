import { describe, expect, it } from 'vitest'
import { getTabCommands } from '../tabCommands'

describe('tabBarFromScratch commands', () => {
  it('only shows reload when there is a single tab', () => {
    const commands = getTabCommands({
      currentFixed: false,
      currentClosable: false,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: true,
      closableCount: 0,
    })

    expect(commands.map(item => item.command)).toEqual(['reload'])
  })

  it('disables close-current when the current tab is fixed or not closable', () => {
    const fixedCurrent = getTabCommands({
      currentFixed: true,
      currentClosable: false,
      firstNonFixed: true,
      lastNonFixed: false,
      onlyOneTab: false,
      closableCount: 2,
    }).find(item => item.command === 'close-current')

    expect(fixedCurrent?.disabled).toBe(true)
  })

  it('disables close-others when there is only one closable tab', () => {
    const closeOthers = getTabCommands({
      currentFixed: false,
      currentClosable: true,
      firstNonFixed: true,
      lastNonFixed: true,
      onlyOneTab: false,
      closableCount: 1,
    }).find(item => item.command === 'close-others')

    expect(closeOthers?.disabled).toBe(true)
  })
})
