import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function waitForDashboard(page: Page) {
  await page.goto('/')
  await expect(page.locator('.screen-grid .panel')).toHaveCount(9, { timeout: 10_000 })
  await expect(page.locator('canvas')).toHaveCount(3, { timeout: 10_000 })
  await page.waitForTimeout(1_500)
}

test.describe('大屏视觉基线', () => {
  test('默认深色主题', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear())
    await waitForDashboard(page)

    await expect(page.locator('.screen-frame')).toHaveScreenshot('dashboard-default.png', {
      animations: 'disabled',
      mask: [page.locator('.brand-clock')],
      maskColor: '#071526',
    })
  })

  test('日间医疗主题', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'medical-dashboard-config',
        JSON.stringify({ schemaVersion: 2, themeId: 'light-medical', layout: '3x3' }),
      )
    })
    await waitForDashboard(page)

    await expect(page.locator('.screen-frame')).toHaveScreenshot('dashboard-light.png', {
      animations: 'disabled',
      mask: [page.locator('.brand-clock')],
      maskColor: '#eef6ff',
    })
  })
})
