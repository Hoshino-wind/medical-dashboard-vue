import { expect, test, type Page } from '@playwright/test'

async function waitForDashboard(page: Page) {
  await page.goto('/')
  await expect(page.locator('.screen-grid .panel')).toHaveCount(9, { timeout: 10_000 })
  await expect(page.locator('.screen-status--loading')).toBeHidden()
}

test.describe('渲染样式与交互契约', () => {
  test('默认大屏保持宽中列、可读品牌区和低动效降级', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => window.localStorage.clear())
    await waitForDashboard(page)

    const panels = page.locator('.screen-grid .panel')
    const left = await panels.nth(0).boundingBox()
    const middle = await panels.nth(1).boundingBox()
    const right = await panels.nth(2).boundingBox()
    expect(left).not.toBeNull()
    expect(middle).not.toBeNull()
    expect(right).not.toBeNull()
    expect(middle!.width).toBeGreaterThan(left!.width)
    expect(middle!.width).toBeGreaterThan(right!.width)

    const screenBounds = await page.locator('.screen-frame').boundingBox()
    const hospitalBounds = await page.locator('.hospital-chip').boundingBox()
    expect(screenBounds).not.toBeNull()
    expect(hospitalBounds).not.toBeNull()
    expect(hospitalBounds!.x + hospitalBounds!.width).toBeLessThanOrEqual(
      screenBounds!.x + screenBounds!.width,
    )
    await expect(page.locator('.hospital-subtitle')).toHaveCSS('white-space', 'nowrap')

    await expect(page.locator('.panel-border-flow').first()).toHaveCSS('animation-name', 'none')
    await expect(page.locator('.hologram-gauge-base').first()).toHaveCSS('filter', 'none')
    await expect(page.locator('.work-order-summary > div')).toHaveCount(4)

    const rootAccent = await page
      .locator('html')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--accent').trim())
    const shellAccent = await page
      .locator('.dashboard-shell')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--accent').trim())
    expect(rootAccent).toBeTruthy()
    expect(shellAccent).toBe(rootAccent)

    const switchButton = page.locator('.view-switch.screen-mode .app-button').last()
    await expect(switchButton).toHaveCSS('opacity', '0')
    await page.locator('.view-switch.screen-mode').hover()
    await expect(switchButton).toHaveCSS('opacity', '1')
  })

  test('浅色立体边框模式使用单层玻璃并禁用机械贴图', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'medical-dashboard-config',
        JSON.stringify({
          schemaVersion: 2,
          themeId: 'light-medical',
          panelStyle: 'chamfered-instrument',
          layout: '3x3',
        }),
      )
    })
    await waitForDashboard(page)

    const shell = page.locator('.dashboard-shell')
    await expect(shell).toHaveAttribute('data-theme-mode', 'light')
    await expect(shell).toHaveAttribute('data-panel-style', 'chamfered-instrument')
    await expect(page.locator('.mechanical-frame').first()).toHaveCSS('display', 'none')

    const panelStyles = await page
      .locator('.screen-grid .panel')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          borderRadius: Number.parseFloat(style.borderRadius),
          backdropFilter: style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter'),
        }
      })
    expect(panelStyles.borderRadius).toBeGreaterThan(0)
    expect(panelStyles.backdropFilter).toContain('blur')

    await expect(page.locator('.panel-title-ornament').first()).toHaveCSS('display', 'none')
  })
})
