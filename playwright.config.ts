import { defineConfig, devices } from '@playwright/test'

const serverUrl = 'http://127.0.0.1:3000'
const adminUrl = 'http://127.0.0.1:5173'
const userUrl = 'http://127.0.0.1:5174'
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    channel: process.env.CI ? undefined : process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? 'msedge',
    trace: 'on-first-retry',
  },
  webServer: skipWebServer
    ? undefined
    : [
        {
          command: 'pnpm --filter vue3-elm-node run start',
          url: `${serverUrl}/api-docs-json`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            APP_PORT: '3000',
            APP_PREFIX: 'api',
            DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/elm_dev?schema=public',
            REDIS_HOST: process.env.REDIS_HOST ?? '127.0.0.1',
            REDIS_PORT: process.env.REDIS_PORT ?? '6379',
          },
        },
        {
          command: 'pnpm --filter elm-web-admin run dev -- --host 127.0.0.1 --port 5173 --strictPort',
          url: adminUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter vue3-elm-js run dev:mock -- --host 127.0.0.1 --port 5174 --strictPort',
          url: userUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
  projects: [
    {
      name: 'server',
      testMatch: /server-health\.spec\.ts/,
      use: {
        baseURL: serverUrl,
      },
    },
    {
      name: 'admin',
      testMatch: /admin-login\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: adminUrl,
      },
    },
    {
      name: 'user',
      testMatch: /user-home\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: userUrl,
      },
    },
  ],
})
