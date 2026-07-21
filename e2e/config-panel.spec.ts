import { test, expect } from '@playwright/test'

/**
 * 配置页关键交互 e2e。
 *
 * 验证:
 *   - 进入 /config 后,可选组件 / 布局板 / 属性面板三栏正常渲染;
 *   - 切换主题 radio 后,根节点 data-theme-id 立即变化;
 *   - 切换布局 2x3 / 3x3 后,布局槽位数与预览一致;
 *   - 持久化:刷新后配置仍在(localStorage)。
 *
 * 配置页是该项目配置驱动架构的"控制台",这里失败通常意味着 store/registry/持久化任一断裂。
 */
test.describe('配置页关键交互', () => {
  test.beforeEach(async ({ page }) => {
    // 注:addInitScript 会在每次 navigation(含 reload)重复执行,
    // 故仅在 goto 之前手动清空 localStorage,避免冲掉持久化测试所依赖的写入。
    await page.goto('/config')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('配置页三栏与效果预览正常渲染', async ({ page }) => {
    // beforeEach 已 goto 过,这里不再重复

    // 三栏标题
    await expect(page.getByRole('heading', { name: '可选业务组件' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '大屏布局' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '大屏属性' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '效果预览' })).toBeVisible()

    // 默认 3x3 -> 9 个布局槽位
    await expect(page.locator('[data-testid^="layout-slot-"]')).toHaveCount(9)

    // 预览内嵌的 BigScreen 也应渲染 9 个 panel(预览是另一个 BigScreen 实例)
    await expect(page.locator('.config-live-preview .panel')).toHaveCount(9, { timeout: 10000 })
  })

  test('切换主题后根节点 data-theme-id 立即变化', async ({ page }) => {
    // beforeEach 已 goto过 /config

    const themeRadio = page.locator('input[name="theme"][value="midnight-violet"]')
    await themeRadio.check()

    // App.vue 的 watchEffect 把 activeTheme 注入到根节点
    await expect(page.locator('.dashboard-shell')).toHaveAttribute(
      'data-theme-id',
      'midnight-violet',
    )
  })

  test('切换布局 3x3 → 2x3 后槽位数变为 6 并持久化', async ({ page }) => {
    // beforeEach 已 goto过 /config

    await page.locator('input[name="layout"][value="2x3"]').check()

    // 槽位数变为 6
    await expect(page.locator('[data-testid^="layout-slot-"]')).toHaveCount(6)

    // 预览同步更新
    await expect(page.locator('.config-live-preview .screen-grid')).toHaveAttribute(
      'data-layout',
      '2x3',
    )

    // 刷新后配置仍在(localStorage 持久化)
    await page.reload()
    await expect(page.locator('[data-testid^="layout-slot-"]')).toHaveCount(6)
  })

  test('点击可选组件卡片可加入布局(在有空槽的前提下)', async ({ page }) => {
    // beforeEach 已 goto过 /config

    // 默认 3x3 已有 9 个模块;先把第一个槽位移除以腾出空位
    await page.locator('[data-testid="layout-slot-0"]').click()

    // 第 10 个模块"设备分布台数占比"应出现在可选列表
    const availableCard = page.locator('[data-testid="available-deviceDistribution"]')
    await expect(availableCard).toBeVisible()

    // 点击加入布局后,可选列表里它消失,第一槽位变成设备分布
    await availableCard.click()
    await expect(availableCard).toHaveCount(0)
    await expect(page.locator('[data-testid="layout-slot-0"]')).toContainText('设备分布台数占比')
  })
})
