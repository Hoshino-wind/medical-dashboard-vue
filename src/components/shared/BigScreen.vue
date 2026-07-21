<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import HeaderBar from './HeaderBar.vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardData } from '@/composables/useDashboardData'

type TitleStyle = 'center' | 'left' | 'strip'

const store = useDashboardStore()
const { selectedSlotModules, activeTheme } = storeToRefs(store)
const route = useRoute()
const screenFrameRef = ref<HTMLElement | null>(null)
const isFauxFullscreen = ref(false)

const { data, loading, error, refresh } = useDashboardData()

const layout = computed(() => store.config.layout)
const titleStyle = computed<TitleStyle>(() => {
  const value = route.query.titleStyle
  return value === 'center' || value === 'strip' ? value : 'left'
})

const visibleModules = computed(() =>
  selectedSlotModules.value.slice(0, layout.value === '2x3' ? 6 : 9),
)

async function toggleFullscreen() {
  if (typeof document === 'undefined') return

  if (isFauxFullscreen.value) {
    isFauxFullscreen.value = false
    return
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.()
      return
    }

    const target = document.documentElement
    if (typeof target.requestFullscreen !== 'function') {
      isFauxFullscreen.value = true
      return
    }

    await target.requestFullscreen()

    if (!document.fullscreenElement) {
      isFauxFullscreen.value = true
    }
  } catch {
    // 浏览器策略或嵌入式预览可能拒绝全屏，此时回退到页面内全屏。
    isFauxFullscreen.value = true
  }
}

function handleFullscreenRequest() {
  void toggleFullscreen()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isFauxFullscreen.value) {
      isFauxFullscreen.value = false
    } else if (typeof document !== 'undefined' && document.fullscreenElement) {
      void document.exitFullscreen?.()
    }
  }
}

onMounted(() => {
  void refresh()
  window.addEventListener('dashboard:toggle-fullscreen', handleFullscreenRequest)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('dashboard:toggle-fullscreen', handleFullscreenRequest)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main
    ref="screenFrameRef"
    class="screen-frame"
    :class="[`title-style-${titleStyle}`, { 'is-faux-fullscreen': isFauxFullscreen }]"
    data-reference-design="medical-equipment-1920x1080"
    :data-title-style="titleStyle"
  >
    <!-- 数据加载/错误守卫:未就绪时不进入 grid,避免子组件拿到 null -->
    <div v-if="loading && !data" class="screen-status screen-status--loading" role="status">
      <span class="screen-status-pulse"></span>
      <span class="screen-status-text">正在加载大屏数据…</span>
    </div>
    <div v-else-if="error && !data" class="screen-status screen-status--error" role="alert">
      <span class="screen-status-text">大屏数据加载失败</span>
      <button class="screen-status-retry" type="button" @click="refresh">重试</button>
    </div>
    <template v-else-if="data">
      <HeaderBar :data="data.header" />
      <section
        class="screen-grid"
        :class="{ 'layout-2x3': layout === '2x3' }"
        :data-layout="layout"
      >
        <template v-for="(item, index) in visibleModules" :key="item?.id ?? `empty-${index}`">
          <ModuleRenderer v-if="item" :module="item" :theme="activeTheme" :data="data" />
          <div v-else class="screen-grid-empty" aria-hidden="true"></div>
        </template>
      </section>
    </template>
  </main>
</template>

<style scoped>
/* 数据加载/错误占位:覆盖整个 screen-frame,居中呈现状态文本 */
.screen-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  min-height: 60vh;
  color: var(--muted);
  font-size: calc(0.875rem * var(--dashboard-font-scale, 1.45));
}
.screen-status--error {
  flex-direction: column;
  gap: 0.5rem;
  color: var(--danger);
}
.screen-status-pulse {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
  animation: screen-status-pulse 1.2s ease-out infinite;
}
@keyframes screen-status-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 70%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0.875rem transparent;
  }
}
.screen-status-text {
  letter-spacing: 0.05em;
}
.screen-status-retry {
  padding: 0.25rem 0.75rem;
  border: 0.0625rem solid var(--accent);
  border-radius: 0.25rem;
  background: transparent;
  color: var(--accent);
  font: inherit;
  cursor: pointer;
}
.screen-status-retry:hover {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}
</style>
