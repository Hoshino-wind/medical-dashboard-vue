import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由:大屏(`/`)与配置页(`/config`)。
 *
 * 替代原先用 `view = ref('screen')` 手动切换视图的方式,
 * 支持 URL 直达、浏览器前进/后退、刷新保持当前页。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'screen',
      component: () => import('@/components/shared/BigScreen.vue'),
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('@/components/shared/ConfigPanel.vue'),
    },
  ],
})

export default router
