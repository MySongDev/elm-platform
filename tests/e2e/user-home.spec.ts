import { expect, test } from '@playwright/test'

test('user app home renders', async ({ page }) => {
  await page.goto('/#/home')

  await expect(page.locator('.logo_name')).toHaveText('elm.me')
  await expect(page.getByText('热门城市')).toBeVisible()
})
