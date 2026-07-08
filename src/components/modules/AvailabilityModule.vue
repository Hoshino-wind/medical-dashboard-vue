<script setup lang="ts">
import { computed } from 'vue'
import AvailabilityMetricRing from '../visual/AvailabilityMetricRing.vue'
import type { AvailabilityItem } from '@/types/dashboard'
import { pxToRem } from '@/utils/rem'

const PAGE_SIZE = 3

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

const shouldLoop = computed(() => pages.value.length > 1)

const renderPages = computed(() =>
  shouldLoop.value ? [...pages.value, pages.value[0]] : pages.value,
)

const pageStepPx = computed(() => (props.variant === 'ultrasound' ? 190 : 198))

const scrollStyle = computed<Record<string, string>>(() => ({
  '--availability-page-count': String(pages.value.length),
  '--availability-scroll-duration': `${pages.value.length * 7.2}s`,
  '--availability-page-step': pxToRem(pageStepPx.value),
  '--availability-scroll-distance': pxToRem(-pageStepPx.value * pages.value.length),
  // linear 连续平滑上滚(替代原先 steps 离散翻页,后者每页停 7.2s 几乎看不出在动)
  '--availability-scroll-easing': 'linear',
}))
</script>

<template>
  <div
    class="availability-grid availability-window h-full"
    :class="[`availability-${variant}`, { 'is-looping': shouldLoop }]"
    :style="scrollStyle"
  >
    <div class="availability-track">
      <div
        v-for="(page, pageIndex) in renderPages"
        :key="pageIndex"
        class="availability-page grid h-full grid-cols-3 items-center gap-1"
      >
        <AvailabilityMetricRing
          v-for="item in page"
          :key="`${pageIndex}-${item.name}`"
          :value="item.value"
          :label="item.name"
          :count="item.count"
          :size="ringSize"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.availability-window {
  min-height: 0;
  overflow: hidden;
}

.availability-track {
  display: grid;
  grid-auto-rows: 100%;
  height: 100%;
  will-change: transform;
}

.availability-page {
  min-height: 0;
  justify-items: center;
}

.availability-window.is-looping .availability-track {
  grid-auto-rows: var(--availability-page-step);
  animation: availability-page-scroll var(--availability-scroll-duration)
    var(--availability-scroll-easing) infinite;
}

@keyframes availability-page-scroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(var(--availability-scroll-distance));
  }
}

@media (prefers-reduced-motion: reduce) {
  .availability-window.is-looping .availability-track {
    animation: none;
  }
}
</style>
