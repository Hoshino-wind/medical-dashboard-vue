<script setup lang="ts">
import { computed } from 'vue'
import CountUp from '../shared/CountUp.vue'
import CubeBarChart from '../charts/CubeBarChart.vue'
import LineAreaChart from '../charts/LineAreaChart.vue'
import type { ChartDisplayType } from '@/types/config'
import type { CartesianChartData, LineChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  /** 展示形态与业务变体相互独立，切图表时不改变数据来源。 */
  chartType: ChartDisplayType
  variant: 'repair' | 'maintenance' | 'inspection'
  seriesName: string
  data: CartesianChartData
  theme: Theme
}>()

const lineFooter = computed(() => {
  if (props.variant === 'repair' || 'series' in props.data) return null
  const values = (props.data as LineChartData).data
  const total = values.reduce((sum, value) => sum + value, 0)

  // 环比:用最新一期与上一期的真实数据算涨跌方向与幅度,替代早先写死的假百分比
  const latest = values.length ? values[values.length - 1] : 0
  const previous = values.length > 1 ? values[values.length - 2] : latest
  const delta = latest - previous
  const changeRatio = previous === 0 ? 0 : (delta / previous) * 100

  return {
    label: props.variant === 'inspection' ? '本周巡检' : '本周保养',
    value: total,
    unit: '台次',
    trend: `${Math.abs(changeRatio).toFixed(1)}%`,
    direction: delta >= 0 ? 'up' : 'down',
  }
})
</script>

<template>
  <div
    class="statistics-chart-module"
    :class="{ 'has-footer': lineFooter }"
    :data-chart-type="chartType"
  >
    <div class="statistics-chart-body">
      <CubeBarChart
        v-if="chartType === 'bar'"
        :data="data"
        :theme="theme"
        :series-name="seriesName"
      />
      <LineAreaChart
        v-else
        :data="data"
        :theme="theme"
        :variant="variant"
        :series-name="seriesName"
      />
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
.statistics-chart-module {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
  gap: 0.25rem;
}
.statistics-chart-module.has-footer {
  grid-template-rows: minmax(0, 1fr) 2.25rem;
}
.statistics-chart-body {
  min-height: 0;
}
.line-chart-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 0;
  overflow: hidden;
  border-top: 0.0625rem solid
    var(--line-footer-border, color-mix(in srgb, var(--border) 34%, transparent));
  color: var(--muted);
  background: var(
    --line-footer-bg,
    linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--glass-highlight) 12%, transparent),
      transparent
    )
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
  border-right: 0.0625rem solid
    var(--line-footer-divider, color-mix(in srgb, var(--border) 24%, transparent));
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
  color: var(--danger);
}
</style>
