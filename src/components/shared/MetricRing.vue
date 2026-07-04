<script setup lang="ts">
import HologramGauge from './visual/HologramGauge.vue'

withDefaults(
  defineProps<{
    value: number
    label?: string
    count?: string | number
    size?: string
    tone?: string
    insideLabel?: string
    showFooter?: boolean
    large?: boolean
  }>(),
  {
    size: '118px',
    tone: 'var(--accent)',
    insideLabel: '',
    showFooter: true,
    large: false,
  },
)
</script>

<template>
  <HologramGauge
    :value="value"
    :label="label"
    :count="count"
    :size="size"
    :tone="tone"
    :inside-label="insideLabel"
    :show-footer="showFooter"
    :large="large"
  />
</template>
