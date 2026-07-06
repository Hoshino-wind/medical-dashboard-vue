<script setup lang="ts">
import CubeBarChart from '../charts/CubeBarChart.vue'
import LineAreaChart from '../charts/LineAreaChart.vue'
import type { BarChartData, LineChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

defineProps<{
  /** 'bar' 渲染柱状图;maintenance/inspection 等渲染折线图(通过 variant 区分配色) */
  type: string
  data: BarChartData | LineChartData
  theme: Theme
  metricLabel?: string
}>()
</script>

<template>
  <CubeBarChart v-if="type === 'bar'" :data="data as BarChartData" :theme="theme" />
  <LineAreaChart
    v-else
    :data="data as LineChartData"
    :theme="theme"
    :variant="type"
    :metric-label="metricLabel"
  />
</template>
