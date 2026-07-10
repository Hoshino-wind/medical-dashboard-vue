<script setup lang="ts">
import { pxToRem } from '@/utils/rem'
import HologramGauge from '../visual/HologramGauge.vue'

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
    curtainVariant?: 'cylinder' | 'fan'
  }>(),
  {
    size: pxToRem(118),
    tone: 'var(--data-ring)',
    insideLabel: '',
    showFooter: true,
    large: false,
    curtainVariant: 'fan',
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
    :curtain-variant="curtainVariant"
  />
</template>
