<script setup lang="ts">
import { computed } from 'vue'
import CubeBarChart from '../charts/CubeBarChart.vue'
import LineAreaChart from '../charts/LineAreaChart.vue'
import type { BarChartData, LineChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  /** 'bar' 渲染柱状图;maintenance/inspection 等渲染折线图(通过 variant 区分配色) */
  type: string
  data: BarChartData | LineChartData
  theme: Theme
}>()

const lineFooter = computed(() => {
  if (props.type === 'bar') return null
  const values = (props.data as LineChartData).data
  const total = values.reduce((sum, value) => sum + value, 0)
  if (props.type === 'inspection') {
    return {
      label: '本周巡检',
      value: total,
      unit: '台次',
      trend: '5.8%',
      direction: 'up',
    }
  }
  return {
    label: '本周保养',
    value: total,
    unit: '台次',
    trend: '8.6%',
    direction: 'down',
  }
})
</script>

<template>
  <CubeBarChart v-if="type === 'bar'" :data="data as BarChartData" :theme="theme" />
  <div v-else class="line-chart-module">
    <div class="line-chart-body">
      <LineAreaChart :data="data as LineChartData" :theme="theme" :variant="type" />
    </div>
    <div v-if="lineFooter" class="line-chart-footer">
      <div>
        <span>{{ lineFooter.label }}</span>
        <b>{{ lineFooter.value.toLocaleString() }}</b>
        <em>{{ lineFooter.unit }}</em>
      </div>
      <div class="line-chart-trend" :class="`is-${lineFooter.direction}`">
        <span>环比上周</span>
        <b>{{ lineFooter.direction === 'up' ? '↑' : '↓' }}</b>
        <strong>{{ lineFooter.trend }}</strong>
      </div>
    </div>
  </div>
</template>
