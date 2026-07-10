<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import echarts, { type ECharts, type EChartsOption } from '@/utils/echarts'
import { pxToRem } from '@/utils/rem'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
    ariaLabel?: string
  }>(),
  {
    height: pxToRem(170),
  },
)

const chartEl = ref<HTMLDivElement | null>(null)
const isChartReady = ref(false)
let chart: ECharts | null = null
let observer: ResizeObserver | null = null
let readyFrame: number | null = null

function hasDrawableSize() {
  const el = chartEl.value
  return Boolean(el && el.clientWidth > 0 && el.clientHeight > 0)
}

function queueReadyFrame() {
  if (readyFrame) cancelAnimationFrame(readyFrame)
  readyFrame = requestAnimationFrame(() => {
    if (!hasDrawableSize()) {
      readyFrame = null
      return
    }
    chart?.resize()
    isChartReady.value = true
    readyFrame = null
  })
}

function render() {
  if (!chartEl.value) return
  if (!hasDrawableSize()) {
    isChartReady.value = false
    return
  }
  if (!chart) {
    isChartReady.value = false
    chart = echarts.init(chartEl.value)
  }
  chart.setOption(props.option, true)
  queueReadyFrame()
}

onMounted(() => {
  nextTick(() => {
    render()
  })
  observer = new ResizeObserver(() => {
    if (!hasDrawableSize()) return
    if (!chart) {
      render()
      return
    }
    chart.resize()
  })
  if (chartEl.value) observer.observe(chartEl.value)
})

watch(() => props.option, render, { deep: true })

onUnmounted(() => {
  if (readyFrame) cancelAnimationFrame(readyFrame)
  observer?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div
    class="chart-shell"
    :class="{ 'is-ready': isChartReady }"
    :style="{ height }"
    role="img"
    :aria-label="ariaLabel"
  >
    <div ref="chartEl" class="chart-canvas w-full" />
    <div class="chart-loading-layer" aria-hidden="true">
      <span class="chart-loading-pulse"></span>
      <span class="chart-loading-bars">
        <i></i><i></i><i></i>
      </span>
    </div>
  </div>
</template>
