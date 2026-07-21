import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/zrender/')) return 'zrender'
          if (id.includes('/node_modules/echarts/')) return 'echarts'
        },
      },
    },
  },
  test: {
    // 组件测试基于 jsdom,挂载 Vue 组件需要 DOM 环境
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // 排除 Playwright e2e 目录,避免 vitest 误拆解 *.spec.ts 调用 Playwright test()
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-ssr/**', 'e2e/**', 'playwright/**'],
  },
})
