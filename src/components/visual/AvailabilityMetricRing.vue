<script setup lang="ts">
import { pxToRem } from '@/utils/rem'
import HologramGauge from './HologramGauge.vue'

withDefaults(
  defineProps<{
    value: number
    label?: string
    count?: string | number
    size?: string
    tone?: string
  }>(),
  {
    size: pxToRem(106),
    tone: 'var(--data-ring)',
  },
)
</script>

<template>
  <HologramGauge
    class="availability-metric-ring"
    :value="value"
    :label="label"
    :count="count"
    :size="size"
    :tone="tone"
    :base-density="0.94"
    :show-footer="true"
  />
</template>

<style scoped>
.availability-metric-ring {
  width: 100%;
  min-height: calc(var(--gauge-size, 6.625rem) * 1.6);
}

/* 舞台预留：上方环体 + 下方放大的底座，文字承接在底座之下 */
.availability-metric-ring :deep(.hologram-gauge-stage) {
  height: calc(var(--gauge-size, 6.625rem) * 1.4);
}

.availability-metric-ring :deep(.hologram-gauge-base) {
  top: calc(var(--gauge-size, 6.625rem) * 0.9);
  width: calc(var(--gauge-size, 6.625rem) * 1.52);
  height: calc(var(--gauge-size, 6.625rem) * 0.52);
}

.availability-metric-ring :deep(.hologram-gauge-footer) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.2rem;
  margin-top: 0.1rem;
  line-height: 0.95;
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-title) {
  overflow: hidden;
  max-width: calc(var(--gauge-size, 8.25rem) * 0.9);
  margin: 0;
  color: color-mix(in srgb, var(--text) 92%, transparent);
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 0.95;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-count) {
  flex: none;
  color: var(--text);
  font-size: 0.76rem;
  line-height: 0.95;
}

.availability-metric-ring :deep(.hologram-gauge-count span) {
  margin-left: 0.125rem;
  font-size: 0.68rem;
}
</style>
