<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Expand, Monitor, Settings } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const { activeTheme, config } = storeToRefs(store)
const route = useRoute()

const themeStyle = computed(() => activeTheme.value.variables)
const themeMode = computed(() => (activeTheme.value.id.startsWith('light-') ? 'light' : 'dark'))
const isConfig = computed(() => route.name === 'config')

watchEffect(() => {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  Object.entries(activeTheme.value.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  root.style.setProperty('color-scheme', themeMode.value)
  root.dataset.themeId = activeTheme.value.id
  root.dataset.themeMode = themeMode.value
  root.dataset.panelStyle = config.value.panelStyle
})

/** RouterLink 自定义渲染为按钮,点击后失焦避免聚焦残留 */
function navigateAndBlur(navigate: (e: MouseEvent) => void, e: MouseEvent) {
  navigate(e)
  ;(e.currentTarget as HTMLButtonElement)?.blur()
}

/** 大屏页的右侧全屏按钮通过事件交给 BigScreen 执行 */
function requestDashboardFullscreen(e: MouseEvent) {
  window.dispatchEvent(new Event('dashboard:toggle-fullscreen'))
  ;(e.currentTarget as HTMLButtonElement)?.blur()
}
</script>

<template>
  <div
    class="dashboard-shell"
    :class="{ 'config-mode': isConfig }"
    :data-theme-mode="themeMode"
    :data-theme-id="activeTheme.id"
    :data-panel-style="config.panelStyle"
    :style="themeStyle"
  >
    <div class="view-switch" :class="{ 'screen-mode': !isConfig }">
      <button
        v-if="!isConfig"
        class="app-button"
        type="button"
        aria-label="全屏显示"
        @click="requestDashboardFullscreen"
      >
        <Expand class="h-4 w-4" />
        全屏
      </button>
      <RouterLink v-else to="/" custom v-slot="{ navigate, isActive }">
        <button
          class="app-button"
          :class="{ active: isActive }"
          type="button"
          @click="(e) => navigateAndBlur(navigate, e)"
        >
          <Monitor class="h-4 w-4" />
          大屏
        </button>
      </RouterLink>
      <RouterLink to="/config" custom v-slot="{ navigate, isActive }">
        <button
          class="app-button"
          :class="{ active: isActive }"
          type="button"
          @click="(e) => navigateAndBlur(navigate, e)"
        >
          <Settings class="h-4 w-4" />
          配置
        </button>
      </RouterLink>
    </div>

    <RouterView />
  </div>
</template>
