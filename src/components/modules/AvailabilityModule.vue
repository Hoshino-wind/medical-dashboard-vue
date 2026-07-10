<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AvailabilityMetricRing from '../visual/AvailabilityMetricRing.vue'
import type { AvailabilityItem } from '@/types/dashboard'
import { pxToRem } from '@/utils/rem'

const PAGE_SIZE = 3
// 翻页间隔：每页停留时间，足够看清进度条增长动画（run() 约 1.2s）
const PAGE_INTERVAL = 5500

const props = withDefaults(
  defineProps<{
    items: AvailabilityItem[]
    variant?: string
  }>(),
  {
    variant: 'life',
  },
)

const ringSize = computed(() => pxToRem(props.variant === 'ultrasound' ? 98 : 104))

const pages = computed(() => {
  const result: AvailabilityItem[][] = []
  for (let index = 0; index < props.items.length; index += PAGE_SIZE) {
    result.push(props.items.slice(index, index + PAGE_SIZE))
  }
  return result.length > 0 ? result : [[]]
})

const shouldPaginate = computed(() => pages.value.length > 1)

const currentIndex = ref(0)
let pageTimer: ReturnType<typeof setInterval> | null = null

const currentPage = computed(() => pages.value[currentIndex.value] ?? [])

function nextPage() {
  if (!shouldPaginate.value) return
  currentIndex.value = (currentIndex.value + 1) % pages.value.length
}

function startAutoPaging() {
  stopAutoPaging()
  if (shouldPaginate.value) {
    pageTimer = setInterval(nextPage, PAGE_INTERVAL)
  }
}

function stopAutoPaging() {
  if (pageTimer) {
    clearInterval(pageTimer)
    pageTimer = null
  }
}

// 数据页数变化后回到第一页并重启计时
watch(
  () => pages.value.length,
  () => {
    currentIndex.value = 0
    startAutoPaging()
  },
)

onMounted(startAutoPaging)
onUnmounted(stopAutoPaging)
</script>

<template>
  <div
    class="availability-grid availability-window h-full"
    :class="[`availability-${variant}`, { 'is-paginating': shouldPaginate }]"
  >
    <Transition name="availability-flip" mode="out-in">
      <!-- :key 绑定当前页索引：每次翻页 Vue 销毁旧页、挂载新页，
           内部的 HologramGauge 重新触发 onMounted → run()，进度条从 0 增长到目标值 -->
      <div
        :key="currentIndex"
        class="availability-page grid h-full grid-cols-3 items-center gap-1"
      >
        <AvailabilityMetricRing
          v-for="(item, itemIndex) in currentPage"
          :key="item.name"
          :value="item.value"
          :label="item.name"
          :count="item.count"
          :size="ringSize"
          :style="{ '--motion-local-phase': `${itemIndex * -1.4}s` }"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.availability-window {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.availability-page {
  min-height: 0;
  justify-items: center;
}

/* 翻页过渡：上滑 + 淡入淡出 */
.availability-flip-enter-active,
.availability-flip-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.availability-flip-enter-from {
  opacity: 0;
  transform: translateY(26px);
}

.availability-flip-leave-to {
  opacity: 0;
  transform: translateY(-26px);
}

@media (prefers-reduced-motion: reduce) {
  .availability-flip-enter-from,
  .availability-flip-leave-to {
    transform: none;
    transition-duration: 0.2s;
  }
}
</style>
