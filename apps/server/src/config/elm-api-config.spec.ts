import configuration from './configuration'
import { validateEnv } from './env.schema'

describe('elm API configuration', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = process.env
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/elm_test',
    }
    delete process.env.ELM_API_BASE_URL
    delete process.env.ELM_API_TIMEOUT_MS
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses the default upstream URL and timeout', () => {
    const validated = validateEnv(process.env)
    const config = configuration() as Record<string, unknown>

    expect(validated).toMatchObject({
      ELM_API_BASE_URL: 'https://elm.cangdu.org',
      ELM_API_TIMEOUT_MS: 8000,
    })
    expect(config.elmApi).toEqual({
      baseUrl: 'https://elm.cangdu.org',
      timeoutMs: 8000,
    })
  })

  it('maps custom validated upstream settings', () => {
    process.env.ELM_API_BASE_URL = 'https://elm.example.test'
    process.env.ELM_API_TIMEOUT_MS = '2500'

    const validated = validateEnv(process.env)
    const config = configuration() as Record<string, unknown>

    expect(validated).toMatchObject({
      ELM_API_BASE_URL: 'https://elm.example.test',
      ELM_API_TIMEOUT_MS: 2500,
    })
    expect(config.elmApi).toEqual({
      baseUrl: 'https://elm.example.test',
      timeoutMs: 2500,
    })
  })

  it('parses scientific notation consistently', () => {
    process.env.ELM_API_TIMEOUT_MS = '1e3'

    const validated = validateEnv(process.env)
    const config = configuration() as Record<string, unknown>

    expect(validated.ELM_API_TIMEOUT_MS).toBe(1000)
    expect(config.elmApi).toEqual({
      baseUrl: 'https://elm.cangdu.org',
      timeoutMs: 1000,
    })
  })

  it.each([
    ['an invalid upstream URL', { ELM_API_BASE_URL: 'not-a-url' }],
    ['a zero timeout', { ELM_API_TIMEOUT_MS: '0' }],
  ])('rejects %s', (_description, overrides) => {
    expect(() =>
      validateEnv({
        ...process.env,
        ...overrides,
      }),
    ).toThrow('Environment validation failed')
  })
})
