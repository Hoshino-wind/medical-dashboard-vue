<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import echarts, { type ECharts, type EChartsOption } from '@/utils/echarts'
import 'echarts-gl'

interface Pie3DItem {
  name: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    items: Pie3DItem[]
    height?: string
    thickness?: number
  }>(),
  {
    height: '150px',
    thickness: 8,
  },
)

const chartEl = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null
let observer: ResizeObserver | null = null

// 生成单个扇区的参数曲面方程(标准 3D 饼图实现)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getParametricEquation(startRatio: number, endRatio: number, _isSelected: boolean, isHovered: boolean, k: number, h: number): any {
  const midRatio = (startRatio + endRatio) / 2
  const startRadian = startRatio * Math.PI * 2
  const endRadian = endRatio * Math.PI * 2
  const midRadian = midRatio * Math.PI * 2
  let isSelected = _isSelected
  if (startRatio === 0 && endRatio === 1) isSelected = false
  const offsetX = isSelected ? Math.cos(midRadian) * 0.1 : 0
  const offsetY = isSelected ? Math.sin(midRadian) * 0.1 : 0
  const hoverRate = isHovered ? 1.05 : 1
  return {
    u: { min: -Math.PI, max: Math.PI * 3, step: Math.PI / 32 },
    v: { min: 0, max: Math.PI * 2, step: Math.PI / 20 },
    x(u: number, v: number) {
      if (u < startRadian) return offsetX + Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      if (u > endRadian) return offsetX + Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      return offsetX + Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate
    },
    y(u: number, v: number) {
      if (u < startRadian) return offsetY + Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate
      if (u > endRadian) return offsetY + Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate
      return offsetY + Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate
    },
    z(u: number, v: number) {
      if (u < -Math.PI * 0.5) return Math.sin(u)
      if (u > Math.PI * 2.5) return Math.sin(u) * h * 0.1
      return Math.sin(v) > 0 ? 1 * h * 0.1 : -1
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPie3D(pieData: Pie3DItem[], internalDiameterRatio: number, h: number): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any[] = []
  let sumValue = 0
  let startValue = 0
  let endValue = 0
  const k = (1 - internalDiameterRatio) / (1 + internalDiameterRatio)

  for (let i = 0; i < pieData.length; i += 1) {
    sumValue += pieData[i].value
    series.push({
      name: pieData[i].name ?? `series${i}`,
      type: 'surface',
      parametric: true,
      wireframe: { show: false },
      pieData: pieData[i],
      itemStyle: { color: pieData[i].color, opacity: 0.96 },
    })
  }

  for (let i = 0; i < series.length; i += 1) {
    endValue = startValue + series[i].pieData.value
    const startRatio = startValue / (sumValue || 1)
    const endRatio = endValue / (sumValue || 1)
    series[i].parametricEquation = getParametricEquation(startRatio, endRatio, false, false, k, h)
    startValue = endValue
  }
  return series
}

function buildOption(): EChartsOption {
  const series = getPie3D(
    props.items.map((it) => ({ ...it })),
    0.55,
    props.thickness,
  )
  return {
    tooltip: {
      backgroundColor: 'rgba(6, 20, 48, 0.92)',
      borderColor: 'rgba(0, 168, 255, 0.6)',
      borderWidth: 1,
      textStyle: { color: '#eaf6ff', fontSize: 12 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const item = props.items.find((it) => it.name === params.seriesName)
        return item ? `${item.name}：<b>${item.value}</b> 台` : (params.seriesName as string)
      },
    },
    xAxis3D: { show: false, min: -1, max: 1 },
    yAxis3D: { show: false, min: -1, max: 1 },
    zAxis3D: { show: false, min: -1, max: 1 },
    grid3D: {
      show: false,
      boxWidth: 100,
      boxDepth: 100,
      boxHeight: 12,
      top: '-6%',
      viewControl: {
        distance: 175,
        alpha: 32,
        beta: 30,
        autoRotate: true,
        autoRotateSpeed: 10,
        zoomSensitivity: 0,
      },
      light: {
        main: { intensity: 1.3, shadow: false, alpha: 40 },
        ambient: { intensity: 0.5 },
      },
    },
    series,
  } as EChartsOption
}

function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  chart.setOption(buildOption(), true)
}

onMounted(() => {
  nextTick(() => {
    render()
    requestAnimationFrame(() => chart?.resize())
  })
  observer = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) observer.observe(chartEl.value)
})

watch(() => props.items, render, { deep: true })

onUnmounted(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div ref="chartEl" class="w-full" :style="{ height }" />
</template>
