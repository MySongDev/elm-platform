import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from './http'

const axiosClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosClient),
    isAxiosError: vi.fn(),
  },
}))

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('defaults API requests to the backend /api prefix when no env base URL is configured', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    createHttpClient({})

    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: '/api',
    }))
  })

  it('keeps an explicitly configured API base URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:3000/api')

    createHttpClient({})

    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'http://127.0.0.1:3000/api',
    }))
  })

  it('returns unwrapped business data from typed methods', async () => {
    axiosClient.get.mockResolvedValueOnce({ data: { code: 200, data: { id: 1, name: 'admin' } } })

    const request = createHttpClient({})
    const result = await request.get<{ id: number, name: string }>('/users/1')

    expect(result).toEqual({ id: 1, name: 'admin' })
    expect(axiosClient.get).toHaveBeenCalledWith('/users/1', undefined)
  })
})
