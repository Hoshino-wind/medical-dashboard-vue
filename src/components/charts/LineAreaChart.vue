<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import EChart from './EChart.vue'
import type { LineChartData } from '@/types/dashboard'
import type { Theme, ThemeVariables } from '@/types/theme'
import { type EChartsOption } from '@/utils/echarts'
import { chartFontSize } from '@/utils/fontScale'
import { colorWithAlpha } from '@/utils/themeColor'
import { resolveCountAxisScale } from './chartAxisScale'

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

const tooltipExtraCssText = 'border-radius: 0.5rem;'
const motionPreference =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
const isReducedMotion = ref(motionPreference?.matches ?? false)

const lastPoint = computed<[string, number] | null>(() => {
  const index = Math.min(props.data.labels.length, props.data.data.length) - 1
  return index >= 0 ? [props.data.labels[index], props.data.data[index]] : null
})

function syncMotionPreference(event?: MediaQueryListEvent) {
  isReducedMotion.value = event?.matches ?? motionPreference?.matches ?? false
}

onMounted(() => {
  if (!motionPreference) return
  syncMotionPreference()
  motionPreference.addEventListener('change', syncMotionPreference)
})

onUnmounted(() => {
  motionPreference?.removeEventListener('change', syncMotionPreference)
})

const option = computed(() => {
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const lineColor =
    props.variant === 'inspection'
      ? token('--data-inspection-line')
      : token('--data-maintenance-line')
  const pointColor =
    props.variant === 'inspection'
      ? token('--data-ring-secondary')
      : token('--data-pie-pending')
  const isLight = props.theme.id.startsWith('light-')
  const areaStops = isLight
    ? [
        { offset: 0, color: colorWithAlpha(lineColor, 0.2) },
        { offset: 0.55, color: colorWithAlpha(lineColor, 0.08) },
        { offset: 1, color: colorWithAlpha(lineColor, 0) },
      ]
    : [
        { offset: 0, color: colorWithAlpha(lineColor, 0.78) },
        { offset: 0.55, color: colorWithAlpha(lineColor, 0.32) },
        { offset: 1, color: colorWithAlpha(lineColor, 0) },
      ]
  const axisScale = resolveCountAxisScale(props.data.data)

  return {
    color: [lineColor],
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    grid: { left: 72, right: 56, top: 36, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.labels,
      axisLabel: { color: muted, fontSize: chartFontSize(11), fontWeight: 800 },
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: axisScale.max,
      interval: axisScale.interval,
      axisLabel: { color: muted, fontSize: chartFontSize(11), fontWeight: 800 },
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
        label: {
          show: true,
          position: 'top',
          color: text,
          fontSize: chartFontSize(10),
          fontWeight: 800,
          distance: 8,
        },
        itemStyle: {
          color: lineColor,
          borderColor: pointColor,
          borderWidth: 2,
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
            colorStops: areaStops,
          },
        },
      },
      {
        type: isReducedMotion.value ? 'scatter' : 'effectScatter',
        coordinateSystem: 'cartesian2d',
        data: lastPoint.value ? [lastPoint.value] : [],
        symbolSize: 10,
        z: 5,
        ...(isReducedMotion.value
          ? {}
          : { rippleEffect: { period: 5, scale: 2.4, brushType: 'stroke' } }),
        itemStyle: {
          color: pointColor,
          shadowBlur: 14,
          shadowColor: lineColor,
        },
        tooltip: { show: false },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(2, 12, 28, 0.9)',
      borderColor: colorWithAlpha(lineColor, isLight ? 0.36 : 0.8),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: chartFontSize(12), fontWeight: 700 },
      axisPointer: {
        lineStyle: { color: colorWithAlpha(lineColor, isLight ? 0.34 : 0.6), width: 1, type: 'dashed' },
        shadowStyle: { color: colorWithAlpha(lineColor, isLight ? 0.05 : 0.08) },
      },
      extraCssText: tooltipExtraCssText,
    },
  } as EChartsOption
})
</script>

<template>
  <EChart
    :class="`chart-${variant}`"
    :option="option"
    :accessible-label="`${variant === 'inspection' ? '巡检统计' : '保养统计'}时间轨迹图`"
    height="100%"
  />
</template>
