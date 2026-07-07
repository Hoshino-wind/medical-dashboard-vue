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
    tone: 'var(--accent)',
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
    :show-footer="false"
  />
</template>

<style scoped>
.availability-metric-ring {
  width: 100%;
  min-height: calc(var(--gauge-size, 6.625rem) * 1.16);
}

.availability-metric-ring :deep(.hologram-gauge-ring) {
  transform: translateY(-0.125rem);
}

.availability-metric-ring :deep(.hologram-gauge-footer) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-top: -1.125rem;
  transform: translateY(-0.25rem);
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-title) {
  overflow: hidden;
  max-width: calc(var(--gauge-size, 8.25rem) * 0.9);
  margin: 0;
  color: color-mix(in srgb, var(--text) 92%, transparent);
  font-size: 0.8125rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-count) {
  flex: none;
  color: var(--text);
  font-size: 0.9375rem;
}

.availability-metric-ring :deep(.hologram-gauge-count span) {
  margin-left: 0.125rem;
  font-size: 0.75rem;
}
</style>
