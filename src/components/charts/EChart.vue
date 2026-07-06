<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import echarts, { type ECharts, type EChartsOption } from '@/utils/echarts'
import { pxToRem } from '@/utils/rem'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: string
  }>(),
  {
    height: pxToRem(170),
  },
)

const chartEl = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null
let observer: ResizeObserver | null = null

function render() {
  if (!chartEl.value) return
  if (!chart) {
    chart = echarts.init(chartEl.value)
  }
  chart.setOption(props.option, true)
}

onMounted(() => {
  nextTick(() => {
    render()
    requestAnimationFrame(() => {
      chart?.resize()
      chart?.setOption(props.option, true)
    })
  })
  observer = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) observer.observe(chartEl.value)
})

watch(() => props.option, render, { deep: true })

onUnmounted(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div ref="chartEl" class="w-full" :style="{ height }" />
</template>
