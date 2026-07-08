<script setup lang="ts">
import { computed } from 'vue'
import type { DeviceDistributionItem } from '@/types/dashboard'

const props = defineProps<{
  items: DeviceDistributionItem[]
}>()

const rows = computed(() =>
  props.items.map((item) => ({
    ...item,
    rate: Number.isFinite(item.rate) ? item.rate : 0,
    progress: `${Math.min(Math.max(item.rate, 0), 100)}%`,
  })),
)
</script>

<template>
  <div class="device-distribution" aria-label="设备分布台数占比">
    <div v-for="item in rows" :key="item.name" class="device-distribution-row">
      <div class="device-distribution-meta">
        <span class="device-distribution-name">{{ item.name }}</span>
        <span class="device-distribution-value">
          <b>{{ item.count.toLocaleString('zh-CN') }}</b><em>台</em>
          <span>({{ item.rate.toFixed(2) }}%)</span>
        </span>
      </div>
      <div
        class="device-distribution-track"
        role="meter"
        :aria-label="`${item.name}设备占比`"
        :aria-valuenow="item.rate"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span class="device-distribution-bar" :style="{ width: item.progress }"></span>
      </div>
    </div>
  </div>
</template>
