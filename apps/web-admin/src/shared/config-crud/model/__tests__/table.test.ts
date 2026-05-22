import { describe, expect, it } from 'vitest'
import { shouldRenderCrudActionPreset } from '../table'

describe('shouldRenderCrudActionPreset', () => {
  it('renders an action preset even when it only customizes text', () => {
    expect(shouldRenderCrudActionPreset({ text: '编辑状态' })).toBe(true)
  })

  it('does not render a missing action preset', () => {
    expect(shouldRenderCrudActionPreset()).toBe(false)
  })
})
