<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { storeToRefs } from 'pinia'
import { Expand, SwatchBook } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import HeaderBar from './HeaderBar.vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardData } from '@/composables/useDashboardData'

type TitleStyle = 'center' | 'left' | 'strip'

type ScreenAction = {
  label: string
  icon: Component
  kind?: 'fullscreen'
  route?: string
}

const store = useDashboardStore()
const { selectedSlotModules, activeTheme } = storeToRefs(store)
const route = useRoute()
const router = useRouter()
const screenFrameRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const isFauxFullscreen = ref(false)

const { data } = useDashboardData()

const layout = computed(() => store.config.layout)
const titleStyle = computed<TitleStyle>(() => {
  const value = route.query.titleStyle
  return value === 'center' || value === 'strip' ? value : 'left'
})

const visibleModules = computed(() =>
  selectedSlotModules.value.slice(0, layout.value === '2x3' ? 6 : 9),
)

const screenActions: ScreenAction[] = [
  { label: '全屏显示', icon: Expand, kind: 'fullscreen' },
  { label: '主题配置', icon: SwatchBook, route: '/config' },
]

function syncFullscreenState() {
  isFullscreen.value =
    (typeof document !== 'undefined' && Boolean(document.fullscreenElement)) ||
    isFauxFullscreen.value
}

async function toggleFullscreen() {
  if (typeof document === 'undefined') return

  if (isFauxFullscreen.value) {
    isFauxFullscreen.value = false
    syncFullscreenState()
    return
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.()
      syncFullscreenState()
      return
    }

    const target = screenFrameRef.value ?? document.documentElement
    if (typeof target.requestFullscreen !== 'function') {
      isFauxFullscreen.value = true
      return
    }

    await target.requestFullscreen()

    if (!document.fullscreenElement) {
      isFauxFullscreen.value = true
    }
  } catch {
    // Fullscreen can be denied by browser policy or embedded preview environments.
    isFauxFullscreen.value = true
  } finally {
    syncFullscreenState()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isFauxFullscreen.value) {
    isFauxFullscreen.value = false
    syncFullscreenState()
  }
}

function runScreenAction(action: ScreenAction) {
  if (action.kind === 'fullscreen') {
    void toggleFullscreen()
    return
  }

  if (action.route) {
    void router.push(action.route)
  }
}

onMounted(() => {
  syncFullscreenState()
  document.addEventListener('fullscreenchange', syncFullscreenState)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main
    ref="screenFrameRef"
    class="screen-frame"
    :class="[`title-style-${titleStyle}`, { 'is-faux-fullscreen': isFauxFullscreen }]"
    data-reference-design="medical-equipment-1920x1080"
    :data-panel-border="store.config.panelBorderMode"
    :data-title-style="titleStyle"
  >
    <HeaderBar :data="data.header" />
    <section class="screen-grid" :class="{ 'layout-2x3': layout === '2x3' }" :data-layout="layout">
      <template v-for="(item, index) in visibleModules" :key="item?.id ?? `empty-${index}`">
        <ModuleRenderer
          v-if="item"
          :module="item"
          :theme="activeTheme"
        />
        <div v-else class="screen-grid-empty" aria-hidden="true"></div>
      </template>
      <span class="screen-energy-spine" aria-hidden="true">
        <i class="screen-energy-spine-core"></i>
        <i class="screen-energy-spine-node screen-energy-spine-node--top"></i>
        <i class="screen-energy-spine-node screen-energy-spine-node--middle"></i>
        <i class="screen-energy-spine-node screen-energy-spine-node--bottom"></i>
      </span>
    </section>
    <div class="screen-actions" aria-label="大屏快捷操作">
      <button
        v-for="action in screenActions"
        :key="action.label"
        class="screen-action"
        type="button"
        :aria-pressed="action.kind === 'fullscreen' ? isFullscreen : undefined"
        @click="runScreenAction(action)"
      >
        <component :is="action.icon" class="screen-action-icon" aria-hidden="true" />
        <span>{{ action.label }}</span>
      </button>
    </div>
  </main>
</template>
