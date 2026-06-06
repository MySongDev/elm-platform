import { expect, test } from '@playwright/test'

test('server health endpoint responds', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.ok()).toBe(true)

  const body = await response.json() as {
    data?: { status?: string }
    status?: string
  }
  const status = body.data?.status ?? body.status

  expect(['ok', 'degraded']).toContain(status)
})
