<script setup lang="ts">
import { computed } from 'vue'
import EChart from './EChart.vue'
import type { CartesianChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import { type EChartsOption } from '@/utils/echarts'
import { resolveChartAxisRange } from '@/utils/chartAxis'
import { chartFontSize } from '@/utils/fontScale'
import { colorWithAlpha } from '@/utils/themeColor'
import { normalizeCartesianChartData } from '@/utils/chartData'
import { useChartTheme } from '@/composables/useChartTheme'

const props = withDefaults(
  defineProps<{
    data: CartesianChartData
    theme: Theme
    variant?: string
    seriesName?: string
  }>(),
  {
    variant: 'maintenance',
    seriesName: '数量',
  },
)

const normalizedData = computed(() => normalizeCartesianChartData(props.data, props.seriesName))

const { token, isLight: isLightTheme } = useChartTheme(() => props.theme)

const tooltipExtraCssText = 'border-radius: 0.5rem;'

const lineColors = computed(() => {
  if (props.variant === 'repair') {
    return [token('--data-bar'), token('--data-bar-2'), token('--data-bar-3')]
  }

  const primary =
    props.variant === 'inspection'
      ? token('--data-inspection-line')
      : token('--data-maintenance-line')
  return [primary, token('--data-bar-2'), token('--data-bar-3')]
})

const legendItems = computed(() =>
  normalizedData.value.series.map((series, index) => ({
    name: series.name,
    color: lineColors.value[index % lineColors.value.length],
  })),
)

const option = computed(() => {
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const data = normalizedData.value
  const colors = lineColors.value
  const lineColor = colors[0]
  const pointColor =
    props.variant === 'inspection' ? token('--data-ring-secondary') : token('--data-pie-pending')
  const isLight = isLightTheme()
  const hasMultipleSeries = data.series.length > 1
  const maxValue = Math.max(0, ...data.series.flatMap((series) => series.data))
  const yAxisRange = resolveChartAxisRange(maxValue)

  function areaStops(color: string) {
    return isLight
      ? [
          { offset: 0, color: colorWithAlpha(color, hasMultipleSeries ? 0.12 : 0.2) },
          { offset: 0.55, color: colorWithAlpha(color, hasMultipleSeries ? 0.04 : 0.08) },
          { offset: 1, color: colorWithAlpha(color, 0) },
        ]
      : [
          { offset: 0, color: colorWithAlpha(color, hasMultipleSeries ? 0.3 : 0.78) },
          { offset: 0.55, color: colorWithAlpha(color, hasMultipleSeries ? 0.1 : 0.32) },
          { offset: 1, color: colorWithAlpha(color, 0) },
        ]
  }

  return {
    color: colors,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: { left: 54, right: 24, top: hasMultipleSeries ? 46 : 30, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.labels,
      axisLabel: { color: muted, fontSize: chartFontSize(9), fontWeight: 800 },
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: yAxisRange.max,
      interval: yAxisRange.interval,
      axisLabel: { color: muted, fontSize: chartFontSize(9), fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1, type: 'dashed' } },
    },
    series: data.series.map((series, index) => {
      const color = colors[index % colors.length]
      return {
        name: series.name,
        data: series.data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        z: 3 + index,
        itemStyle: {
          color,
          borderColor: index === 0 ? pointColor : colorWithAlpha(color, 0.82),
          borderWidth: 2,
        },
        // 单系列保留逐点数值；多系列用 tooltip，避免标签互相遮挡。
        label: {
          show: !hasMultipleSeries,
          position: 'top',
          color: text,
          fontSize: chartFontSize(9),
          fontWeight: 800,
          distance: 6,
        },
        lineStyle: {
          width: isLight ? 3 : 3.6,
          cap: 'round',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: areaStops(color),
          },
        },
      }
    }),
    tooltip: {
      trigger: 'axis',
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(2, 12, 28, 0.9)',
      borderColor: colorWithAlpha(lineColor, isLight ? 0.36 : 0.8),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: chartFontSize(10), fontWeight: 700 },
      axisPointer: {
        lineStyle: {
          color: colorWithAlpha(lineColor, isLight ? 0.34 : 0.6),
          width: 1,
          type: 'dashed',
        },
        shadowStyle: { color: colorWithAlpha(lineColor, isLight ? 0.05 : 0.08) },
      },
      extraCssText: tooltipExtraCssText,
    },
  } as EChartsOption
})
</script>

<template>
  <div class="line-area-chart">
    <div v-if="legendItems.length > 1" class="line-area-legend" aria-hidden="true">
      <span v-for="item in legendItems" :key="item.name" :style="{ color: item.color }">
        <i :style="{ backgroundColor: item.color }"></i>{{ item.name }}
      </span>
    </div>
    <EChart :class="`chart-${variant}`" :option="option" height="100%" />
  </div>
</template>

<style scoped>
.line-area-chart {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.line-area-legend {
  position: absolute;
  top: 0.25rem;
  right: 1.125rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: calc(0.75rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}
.line-area-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  white-space: nowrap;
}
.line-area-legend i {
  width: 0.75rem;
  height: 0.1875rem;
  border-radius: 62.4375rem;
  box-shadow: 0 0 0.5rem currentColor;
}
</style>
