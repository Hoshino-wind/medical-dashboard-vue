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

const { data } = useDashboardData()

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
    // Fullscreen can be denied by browser policy or embedded preview environments.
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
    </section>
  </main>
</template>
