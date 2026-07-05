<script setup lang="ts">
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
    size: '106px',
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
  />
</template>

<style scoped>
.availability-metric-ring {
  width: 100%;
  min-height: 154px;
}

.availability-metric-ring :deep(.hologram-gauge-base) {
  bottom: 21px;
  width: calc(var(--gauge-size, 106px) + 62px);
  height: calc(var(--gauge-size, 106px) * 0.52);
}

.availability-metric-ring :deep(.hologram-gauge-ring) {
  transform: translateY(-11px);
}

.availability-metric-ring :deep(.hologram-gauge-content) {
  top: calc(var(--gauge-size, 106px) * 0.31);
}

.availability-metric-ring :deep(.hologram-gauge-footer) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-top: -24px;
  transform: translateY(-8px);
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-title) {
  overflow: hidden;
  max-width: calc(var(--gauge-size, 106px) * 0.78);
  margin: 0;
  color: color-mix(in srgb, var(--text) 92%, transparent);
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.availability-metric-ring :deep(.hologram-gauge-count) {
  flex: none;
  color: var(--text);
  font-size: 12px;
}

.availability-metric-ring :deep(.hologram-gauge-count span) {
  margin-left: 2px;
  font-size: 10px;
}
</style>
