<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Monitor, Settings } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const { activeTheme } = storeToRefs(store)
const route = useRoute()

const themeStyle = computed(() => activeTheme.value.variables)
const isConfig = computed(() => route.name === 'config')

/** RouterLink 自定义渲染为按钮,点击后失焦避免聚焦残留 */
function navigateAndBlur(navigate: (e: MouseEvent) => void) {
  return (e: MouseEvent) => {
    navigate(e)
    ;(e.currentTarget as HTMLButtonElement)?.blur()
  }
}
</script>

<template>
  <div class="dashboard-shell" :class="{ 'config-mode': isConfig }" :style="themeStyle">
    <div class="view-switch" :class="{ 'screen-mode': !isConfig }">
      <RouterLink to="/" custom v-slot="{ navigate, isActive }">
        <button
          class="app-button"
          :class="{ active: isActive }"
          type="button"
          @click="navigateAndBlur(navigate)"
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
          @click="navigateAndBlur(navigate)"
        >
          <Settings class="h-4 w-4" />
          配置
        </button>
      </RouterLink>
    </div>

    <RouterView />
  </div>
</template>
