import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadConfigFromFile } from 'vite'

const viteConfigPath = path.resolve('vite.config.js')

describe('vite proxy target', () => {
  it('uses IPv4 loopback for local Nest API proxy targets', async () => {
    const loaded = await loadConfigFromFile({
      command: 'serve',
      mode: 'development',
    }, viteConfigPath)
    const config = loaded?.config ?? {}
    const proxy = config.server?.proxy ?? {}
    const targets = Object.values(proxy).map(entry =>
      typeof entry === 'string' ? entry : entry.target,
    )

    expect(targets).toEqual([
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3000/api',
    ])
  })
})
