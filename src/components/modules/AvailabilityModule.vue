<script setup lang="ts">
import { computed } from 'vue'
import MetricRing from '../MetricRing.vue'
import type { AvailabilityItem } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{
    items: AvailabilityItem[]
    variant?: string
  }>(),
  {
    variant: 'life',
  },
)

const ringTones = computed(() => {
  if (props.variant === 'ultrasound') {
    return ['var(--accent)', 'var(--accent-3)', 'var(--accent-2)']
  }
  return ['var(--accent)', 'var(--accent-2)', 'var(--accent)']
})

const ringSize = computed(() => (props.variant === 'ultrasound' ? '112px' : '118px'))
</script>

<template>
  <div
    class="availability-grid grid h-full grid-cols-3 items-center gap-2"
    :class="`availability-${variant}`"
  >
    <MetricRing
      v-for="(item, index) in items"
      :key="item.name"
      :value="item.value"
      :label="item.name"
      :count="item.count"
      :tone="ringTones[index % ringTones.length]"
      :size="ringSize"
    />
  </div>
</template>
