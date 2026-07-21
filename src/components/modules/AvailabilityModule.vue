<script setup lang="ts">
import { computed } from 'vue'
import AvailabilityMetricRing from '../visual/AvailabilityMetricRing.vue'
import { usePagedCarousel } from '@/composables/usePagedCarousel'
import type { AvailabilityItem } from '@/types/dashboard'
import type { ColorMode } from '@/types/config'
import type { AvailabilityVariant } from '@/types/module'
import { pxToRem } from '@/utils/rem'

const PAGE_SIZE = 3
// 翻页间隔：每页停留时间，足够看清进度条增长动画（run() 约 1.2s）
const PAGE_INTERVAL = 5500

const props = withDefaults(
  defineProps<{
    items: AvailabilityItem[]
    /** 业务变体,限定为 life/ultrasound(其余取值对该模块无意义) */
    variant?: AvailabilityVariant
    /** 环图配色模式,由上层配置(moduleRegistry)注入,不再直接读 store */
    ringColorMode?: ColorMode
  }>(),
  {
    variant: 'life',
    ringColorMode: 'solid',
  },
)

const ringSize = computed(() => pxToRem(props.variant === 'ultrasound' ? 98 : 104))

// 环图多色交叉:仅保留区分度高的色相(蓝/绿/橙/紫),避免玫红、品红等相近色;
// 亮红色保留给数值低于 50% 的环作警示。两个可用率模块(life/ultrasound)错开起点。
const RING_PALETTE = [
  'var(--data-bar)',
  'var(--data-health-pie-good)',
  'var(--data-health-pie-warning)',
  'var(--data-pie-pending)',
]

const pages = computed(() => {
  const result: AvailabilityItem[][] = []
  for (let index = 0; index < props.items.length; index += PAGE_SIZE) {
    result.push(props.items.slice(index, index + PAGE_SIZE))
  }
  return result.length > 0 ? result : [[]]
})

const { currentIndex, shouldPaginate } = usePagedCarousel({
  pageCount: () => pages.value.length,
  interval: PAGE_INTERVAL,
})

const currentPage = computed(() => pages.value[currentIndex.value] ?? [])

function ringColorAt(localIndex: number, value: number): string {
  if (value < 50) return 'var(--danger)'
  const offset = props.variant === 'ultrasound' ? 2 : 0
  const globalIndex = currentIndex.value * PAGE_SIZE + localIndex + offset
  return RING_PALETTE[globalIndex % RING_PALETTE.length]
}
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
          v-for="(item, localIndex) in currentPage"
          :key="item.name"
          :value="item.value"
          :label="item.name"
          :count="item.count"
          :size="ringSize"
          :tone="ringColorAt(localIndex, item.value)"
          :color-mode="ringColorMode"
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

.availability-grid.availability-life,
.availability-grid.availability-ultrasound {
  transform: translate(0, 0.35rem);
}
</style>
