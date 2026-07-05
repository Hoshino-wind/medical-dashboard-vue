<script setup lang="ts">
import { computed } from 'vue'
import EChart from './EChart.vue'
import type { LineChartData } from '@/types/dashboard'
import type { Theme, ThemeVariables } from '@/types/theme'
import { type EChartsOption } from '@/utils/echarts'

const props = withDefaults(
  defineProps<{
    data: LineChartData
    theme: Theme
    variant?: string
  }>(),
  {
    variant: 'maintenance',
  },
)

function token(name: keyof ThemeVariables): string {
  return props.theme.variables[name]
}

const option = computed(() => {
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const accent = token('--accent')
  const accent2 = token('--accent-2')
  const accent3 = token('--accent-3')
  const lineColor = props.variant === 'inspection' ? accent2 : accent3

  return {
    color: [lineColor],
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: { left: 44, right: 16, top: 22, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.labels,
      axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1, type: 'dashed' } },
    },
    series: [
      {
        data: props.data.data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        z: 3,
        itemStyle: {
          color: lineColor,
          borderColor: '#ffffff',
          borderWidth: 1.4,
          shadowBlur: 12,
          shadowColor: lineColor,
        },
        lineStyle: {
          width: 3,
          cap: 'round',
          shadowColor: 'rgba(2, 10, 32, 0.55)',
          shadowBlur: 8,
          shadowOffsetY: 9,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${lineColor}aa` },
              { offset: 0.55, color: `${lineColor}3a` },
              { offset: 1, color: `${lineColor}00` },
            ],
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6, 20, 48, 0.92)',
      borderColor: `${accent}cc`,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: 12, fontWeight: 700 },
      axisPointer: {
        lineStyle: { color: `${accent2}99`, width: 1, type: 'dashed' },
        shadowStyle: { color: `${accent}14` },
      },
      extraCssText: 'border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 120, 220, 0.35);',
    },
  } as EChartsOption
})
</script>

<template>
  <EChart :class="`chart-${variant}`" :option="option" height="100%" />
</template>
