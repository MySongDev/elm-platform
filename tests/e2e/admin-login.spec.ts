import { expect, test } from '@playwright/test'

test('admin login page renders', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Elm Admin' })).toBeVisible()
  await expect(page.locator('input').first()).toBeVisible()
})
