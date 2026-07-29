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
    await expect(page.locator('.work-order-summary')).toHaveCount(0)

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

  test('浅色立体边框使用雾蓝瓷白材质与分层指标卡', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'medical-dashboard-config',
        JSON.stringify({
          schemaVersion: 4,
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
    const mechanicalFrame = page.locator('.mechanical-frame--panel').first()
    await expect(mechanicalFrame).toHaveCSS('display', 'block')
    await expect(mechanicalFrame).toHaveCSS('border-image-source', /panel-light-medical-v4\.png/)
    await expect(mechanicalFrame).toHaveCSS('border-image-slice', '15')
    await expect(mechanicalFrame).toHaveCSS('border-width', '15px')
    await expect(mechanicalFrame).toHaveCSS('border-radius', '12px')
    await expect(mechanicalFrame).toHaveCSS('opacity', '0.92')

    const panelStyles = await page
      .locator('.screen-grid .panel')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          backgroundImage: style.backgroundImage,
          borderRadius: Number.parseFloat(style.borderRadius),
          backdropFilter: style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter'),
          boxShadow: style.boxShadow,
        }
      })
    expect(panelStyles.backgroundImage).toContain('rgba(249, 252, 254, 0.97)')
    expect(panelStyles.borderRadius).toBe(12)
    expect(panelStyles.backdropFilter).toContain('blur')
    expect(panelStyles.boxShadow).toBe('none')

    await expect(page.locator('.screen-grid > .panel > .panel-body').first()).toHaveCSS(
      'padding-left',
      '18px',
    )
    await expect(page.locator('.screen-grid > .panel > .panel-body').first()).toHaveCSS(
      'padding-right',
      '18px',
    )

    const titleMaskBackground = await page
      .locator('.panel-title-frame')
      .first()
      .evaluate((element) => getComputedStyle(element, '::before').backgroundImage)
    expect(titleMaskBackground).toContain('rgba(235, 244, 248, 0)')

    const compactFrame = page.locator('.module-status-summary .mechanical-frame--compact').first()
    await expect(compactFrame).toHaveCSS('border-image-source', 'none')
    await expect(compactFrame).toHaveCSS('border-width', '1px')
    await expect(compactFrame).toHaveCSS('border-radius', '8px')
    await expect(compactFrame).toHaveCSS('box-shadow', 'none')
    await expect(page.locator('.module-status-summary > div').first()).toHaveCSS(
      'background-image',
      /rgb\(238, 245, 248\)/,
    )

    const overviewStat = page.locator('.overview-stat').first()
    await expect(overviewStat).toHaveCSS('border-radius', '12px')
    await expect(overviewStat).toHaveCSS('background-image', /rgb\(247, 251, 253\)/)
    await expect(overviewStat).toHaveCSS('box-shadow', /rgba\(24, 50, 74, 0\.075\)/)
    await expect(overviewStat.locator('.mechanical-frame--compact')).toHaveCSS('display', 'none')
    await expect(overviewStat.locator('.overview-stat-icon')).toHaveCSS('border-radius', '9px')

    await expect(page.locator('.panel-title-text').first()).toHaveCSS('color', 'rgb(22, 119, 255)')
    await expect(page.locator('.panel-title-ornament').first()).toHaveCSS('display', 'block')
  })
})
