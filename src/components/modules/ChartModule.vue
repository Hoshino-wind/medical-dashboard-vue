<script setup lang="ts">
import { computed } from 'vue'
import CountUp from '../shared/CountUp.vue'
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
        <b><CountUp :value="lineFooter.value" /></b>
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

<style scoped>
.line-chart-module {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr) 2.25rem;
  gap: 0.25rem;
}
.line-chart-body {
  min-height: 0;
}
.line-chart-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 0;
  overflow: hidden;
  border-top: 0.0625rem solid var(--line-footer-border, color-mix(in srgb, var(--border) 34%, transparent));
  color: var(--muted);
  background: var(
    --line-footer-bg,
    linear-gradient(90deg, transparent, color-mix(in srgb, var(--glass-highlight) 12%, transparent), transparent)
  );
}
.line-chart-footer > div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  min-width: 0;
  white-space: nowrap;
}
.line-chart-footer > div:first-child {
  border-right: 0.0625rem solid var(--line-footer-divider, color-mix(in srgb, var(--border) 24%, transparent));
}
.line-chart-footer span {
  font-size: calc(0.64rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
}
.line-chart-footer b {
  color: var(--text);
  font-size: calc(0.86rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
  font-style: normal;
}
.line-chart-footer em {
  font-size: calc(0.58rem * var(--dashboard-font-scale, 1.45));
  font-style: normal;
  font-weight: 850;
}
.line-chart-trend strong {
  font-size: calc(0.88rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
}
.line-chart-trend.is-up b,
.line-chart-trend.is-up strong {
  color: var(--good);
}
.line-chart-trend.is-down b,
.line-chart-trend.is-down strong {
  color: var(--good);
}
</style>
