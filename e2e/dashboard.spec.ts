import { test, expect } from '@playwright/test'

/**
 * 大屏主页加载关键路径 e2e。
 *
 * 验证:
 *   - 1920x1080 视口下主页可访问;
 *   - 异步数据加载完成后,9 个模块卡片正确渲染;
 *   - 顶部 header 文案与默认主题属性生效。
 *
 * 这些用例对应"配置驱动渲染 + 异步数据层 + 主题注入"三大架构支柱,
 * 一旦有人误改核心链路(模块注册表、provide/inject、数据仓库)即可失败。
 */
test.describe('大屏主页加载', () => {
  test.beforeEach(async ({ page }) => {
    // 注:addInitScript 会在每次 navigation(含 reload)重复执行,会干扰持久化相关调试;
    // 这里大屏测试不涉及持久化,但仍采用统一的「手动清一次 + reload」模式以保持一致。
    await page.goto('/')

    expect(page.viewportSize()).toEqual({ width: 1920, height: 1080 })
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('异步拉取数据后渲染默认 9 个模块卡片', async ({ page }) => {
    // beforeEach 已 goto过 /

    // 数据加载守卫:loading 状态会短暂出现,但应在 5s 内消失
    await expect(page.locator('.screen-status--loading')).toBeHidden({ timeout: 5000 })

    // 默认 layout = 3x3,应渲染 9 个 panel 卡片
    const panels = page.locator('.screen-grid .panel')
    await expect(panels).toHaveCount(9, { timeout: 5000 })

    // 默认主题 deep-sea-instrument 应注入到根节点
    await expect(page.locator('.dashboard-shell')).toHaveAttribute(
      'data-theme-id',
      'deep-sea-instrument',
    )
  })

  test('默认主题下渲染顶部 header 与品牌信息', async ({ page }) => {
    // beforeEach 已 goto过 /

    // HeaderBar 在数据就绪后渲染(从 BigScreen 的 v-else-if="data" 分支)
    await expect(page.getByText('医疗设备全场景智慧管理系统')).toBeVisible()
    await expect(page.getByText('江门市中心医院')).toBeVisible()
  })

  test('配置驱动的模块标题按默认顺序排列', async ({ page }) => {
    // beforeEach 已 goto过 /

    // 等待模块挂载
    await expect(page.locator('.screen-grid .panel').first()).toBeVisible()

    const titles = await page.locator('.screen-grid .panel .panel-title-text').allTextContents()

    // 与 moduleCatalog 默认前 9 项保持一致(第 10 项"设备分布台数占比"不在 3x3 内)
    expect(titles).toEqual([
      '设备总览',
      '维修工单',
      '保修统计',
      '生命支持设备可用率',
      '巡检工单',
      '保养统计',
      '超声设备可用率',
      '保养工单',
      '巡检统计',
    ])
  })
})
