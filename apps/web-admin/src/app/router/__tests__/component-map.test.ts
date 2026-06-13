import { describe, expect, it } from 'vitest'
import { resolveComponent } from '../component/component-map'

describe('component-map', () => {
  it('resolves nested admin pages from the src/pages directory', () => {
    expect(String(resolveComponent('monitor/logs/login'))).toContain(
      '/src/pages/monitor/logs/login/index.vue',
    )
  })
})
