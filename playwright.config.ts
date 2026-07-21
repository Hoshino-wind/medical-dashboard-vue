import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置。
 *
 * 设计目标:
 *   - 自动拉起 `vite dev server` 作为 webServer,无需手动启动;
 *   - 视口固定为 1920x1080(本项目为大屏,默认 1280x720 会触发响应式分支);
 *   - 仅跑 chromium 以减少 CI 时间,需要兼容性测试时再加 firefox/webkit;
 *   - 失败用例自动截图 + trace,便于本地复现。
 */
export default defineConfig({
  testDir: './e2e',
  // 基线文件名跨操作系统保持一致，CI 与本地共同维护同一份视觉契约。
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    // 大屏存在大量渐变/动画,给截图对比留些容差
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: 'http://localhost:5180',
    viewport: { width: 1920, height: 1080 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 项目级设备参数会覆盖顶层 use，必须在展开设备后重申大屏视口。
        viewport: { width: 1920, height: 1080 },
        reducedMotion: 'reduce',
      },
    },
  ],
  webServer: {
    // 使用专属端口 + strictPort 避免与本地其他 vite 项目(常驻 5173)冲突。
    // 直接调用 vite 而不走 pnpm dev,确保参数可控。
    command: 'pnpm exec vite --port 5180 --strictPort --host 127.0.0.1',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
