<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import echarts, { type EChartsOption } from '@/utils/echarts'
import EChart from './EChart.vue'
import type { BarChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import { pxToRem } from '@/utils/rem'
import { colorWithAlpha } from '@/utils/themeColor'
import {
  BASE_DROP,
  BASE_VERTICAL_OFFSET,
  BAR_ANIMATION_DURATION,
  createColumnBasePoint,
  createBaseCuboidGeometry,
  interpolateBarValue,
} from './cubeBarGeometry'

const CUBE_HALF = 12
const CUBE_DEPTH = 7
const AXIS_DEPTH = 20
const AXIS_HEIGHT = 30
const AXIS_SLANT = 15
const LIQUID_MIN_HEIGHT = 10
const LIQUID_MAX_HEIGHT = 44

// 玻璃柱体由左右面、顶面、内部青色液面叠加，方便接近参考图的透明 3D 质感。
const GlassColumnLeft = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; xAxisPoint: number[] }) {
    const p = shape.xAxisPoint
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x - CUBE_HALF, shape.y - CUBE_DEPTH)
    ctx.lineTo(p[0] - CUBE_HALF, p[1] - CUBE_DEPTH)
    ctx.lineTo(p[0], p[1])
    ctx.closePath()
  },
})

const GlassColumnRight = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; xAxisPoint: number[] }) {
    const p = shape.xAxisPoint
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(p[0], p[1])
    ctx.lineTo(p[0] + CUBE_HALF, p[1] - CUBE_DEPTH)
    ctx.lineTo(shape.x + CUBE_HALF, shape.y - CUBE_DEPTH)
    ctx.closePath()
  },
})

const GlassColumnTop = echarts.graphic.extendShape({
  shape: { x: 0, y: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number }) {
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + CUBE_HALF, shape.y - CUBE_DEPTH)
    ctx.lineTo(shape.x, shape.y - CUBE_DEPTH * 2)
    ctx.lineTo(shape.x - CUBE_HALF, shape.y - CUBE_DEPTH)
    ctx.closePath()
  },
})

const CuboidAxisTop = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y)
    ctx.lineTo(shape.x + shape.width + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.lineTo(shape.x + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.closePath()
  },
})

const CuboidAxisFront = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y + AXIS_HEIGHT)
    ctx.lineTo(shape.x, shape.y + AXIS_HEIGHT)
    ctx.closePath()
  },
})

const CuboidAxisRight = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    const right = shape.x + shape.width
    ctx.moveTo(right, shape.y)
    ctx.lineTo(right + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.lineTo(right + AXIS_SLANT, shape.y - AXIS_DEPTH + AXIS_HEIGHT)
    ctx.lineTo(right, shape.y + AXIS_HEIGHT)
    ctx.closePath()
  },
})

// HMR 下模块会重新求值;用模块级标志位避免 registerShape 重名报错,
// 取代原先吞掉所有异常的 try/catch(那会掩盖真实错误)。
const registered = (globalThis as Record<string, unknown>).__CUBE_SHAPES_REGISTERED__
if (!registered) {
  echarts.graphic.registerShape('GlassColumnLeft', GlassColumnLeft)
  echarts.graphic.registerShape('GlassColumnRight', GlassColumnRight)
  echarts.graphic.registerShape('GlassColumnTop', GlassColumnTop)
  echarts.graphic.registerShape('CuboidAxisTop', CuboidAxisTop)
  echarts.graphic.registerShape('CuboidAxisFront', CuboidAxisFront)
  echarts.graphic.registerShape('CuboidAxisRight', CuboidAxisRight)
  ;(globalThis as Record<string, unknown>).__CUBE_SHAPES_REGISTERED__ = true
}

const props = defineProps<{
  data: BarChartData
  theme: Theme
}>()

const animationProgress = ref(0)
let animationFrame = 0

function token(name: keyof Theme['variables']): string {
  return props.theme.variables[name]
}

function runColumnAnimation() {
  cancelAnimationFrame(animationFrame)
  animationProgress.value = 0
  let start: number | null = null

  const step = (timestamp: number) => {
    if (start === null) start = timestamp
    const progress = Math.min(1, (timestamp - start) / BAR_ANIMATION_DURATION)
    animationProgress.value = progress
    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    }
  }

  animationFrame = requestAnimationFrame(step)
}

onMounted(runColumnAnimation)
watch(() => props.data, runColumnAnimation, { deep: true })
onUnmounted(() => cancelAnimationFrame(animationFrame))

const option = computed(() => {
  const labels = props.data.labels
  const series = props.data.series
  const barValues = labels.map((_, i) => series.find((item) => (item.data[i] || 0) > 0)?.data[i] || 0)
  const animatedBarValues = barValues.map((value) =>
    interpolateBarValue(value, animationProgress.value),
  )
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] || 0), 0))
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const dataBar = token('--data-bar')
  const dataBarSecondary = token('--data-bar-secondary')
  const instrumentBase = token('--instrument-base')
  const instrumentBaseRim = token('--instrument-base-rim')
  const surface = token('--surface')
  const surfaceStrong = token('--surface-strong')
  const themed = colorWithAlpha
  const isLight = props.theme.id.startsWith('light-')
  const tooltipExtraCssText = `border-radius: ${pxToRem(8)}; box-shadow: 0 ${pxToRem(6)} ${pxToRem(18)} ${themed(dataBar, isLight ? 0.08 : 0.24)};`

  // 主题青蓝只负责框架;柱体和底座分开成数据绿与中性仪器材质,避免整张图同色发光。
  const glassLeftFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: colorWithAlpha(dataBarSecondary, isLight ? 0.58 : 0.76) },
    { offset: 0.5, color: colorWithAlpha(dataBar, isLight ? 0.28 : 0.4) },
    { offset: 1, color: colorWithAlpha(dataBar, isLight ? 0.06 : 0.1) },
  ])
  const glassRightFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: colorWithAlpha(instrumentBase, isLight ? 0.48 : 0.64) },
    { offset: 0.55, color: colorWithAlpha(dataBar, isLight ? 0.16 : 0.26) },
    { offset: 1, color: colorWithAlpha(dataBar, isLight ? 0.04 : 0.08) },
  ])
  const topCapFill = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: colorWithAlpha(instrumentBaseRim, isLight ? 0.58 : 0.86) },
    { offset: 1, color: colorWithAlpha(dataBarSecondary, isLight ? 0.42 : 0.62) },
  ])
  const liquidFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: colorWithAlpha(dataBarSecondary, isLight ? 0.42 : 0.58) },
    { offset: 0.78, color: colorWithAlpha(dataBar, isLight ? 0.14 : 0.24) },
    { offset: 1, color: colorWithAlpha(dataBar, isLight ? 0.04 : 0.08) },
  ])
  const liquidSideFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: colorWithAlpha(dataBar, isLight ? 0.28 : 0.46) },
    { offset: 1, color: colorWithAlpha(dataBar, isLight ? 0.04 : 0.08) },
  ])
  const liquidTopFill = new echarts.graphic.RadialGradient(0.5, 0.55, 0.72, [
    { offset: 0, color: colorWithAlpha(instrumentBaseRim, 0.68) },
    { offset: 0.6, color: colorWithAlpha(dataBarSecondary, 0.3) },
    { offset: 1, color: colorWithAlpha(dataBar, 0.06) },
  ])
  const baseLeftFill = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: themed(instrumentBaseRim, 0.13) },
    { offset: 0.52, color: themed(instrumentBase, 0.2) },
    { offset: 1, color: themed(surface, 0.24) },
  ])
  const baseDeckFill = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: themed(instrumentBaseRim, 0.28) },
    { offset: 0.36, color: themed(instrumentBase, 0.44) },
    { offset: 0.72, color: themed(instrumentBase, 0.3) },
    { offset: 1, color: themed(surfaceStrong, 0.22) },
  ])
  const baseFrontFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: themed(instrumentBaseRim, 0.2) },
    { offset: 0.3, color: themed(instrumentBase, 0.18) },
    { offset: 0.72, color: themed(surfaceStrong, 0.34) },
    { offset: 1, color: themed(surface, 0.18) },
  ])
  const baseRightFill = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: themed(instrumentBaseRim, 0.14) },
    { offset: 0.58, color: themed(instrumentBase, 0.18) },
    { offset: 1, color: themed(surface, 0.16) },
  ])
  return {
    animationDuration: 1000,
    // 上下留白配平:底部比顶部多 ~16px,抵消 3D 底座向下延伸,使视觉留白对称、数据不贴底
    grid: { left: 44, right: 16, top: 50, bottom: 66 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 400,
      interval: 100,
      axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1, type: 'dashed' } },
    },
    series: [
      {
        type: 'custom',
        encode: { x: 0, y: 1 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem(params: any, api: any) {
          const val = api.value(1)
          const index = api.value(0)
          const label = labels[index]
          const base = api.coord([api.value(0), 0])
          const chartTop = params.coordSys?.y ?? 0
          const band = Math.max(42, api.size([1, 0])[0])
          const axisX = base[0] - band * index - band * 0.49
          const axisWidth = band * labels.length * 0.98
          const baseGeometry = createBaseCuboidGeometry({
            axisX,
            baseY: base[1] + 1,
            width: axisWidth,
            slant: AXIS_SLANT,
            depth: AXIS_DEPTH,
            drop: BASE_DROP,
            offsetY: BASE_VERTICAL_OFFSET,
          })
          const axisY = baseGeometry.axisY
          const cubeBase = createColumnBasePoint({
            categoryX: base[0],
            axisY,
            slant: AXIS_SLANT,
            depth: AXIS_DEPTH,
          })
          const barX = cubeBase[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const children: any[] = []

          if (index === 0) {
            children.push(
              {
                type: 'polygon',
                shape: {
                  points: baseGeometry.faces.left,
                },
                style: {
                  fill: baseLeftFill,
                  lineWidth: 0,
                },
                silent: true,
              },
              {
                type: 'polygon',
                shape: {
                  points: baseGeometry.faces.front,
                },
                style: {
                  fill: baseFrontFill,
                  lineWidth: 0,
                },
                silent: true,
              },
              {
                type: 'polygon',
                shape: {
                  points: baseGeometry.faces.right,
                },
                style: {
                  fill: baseRightFill,
                  lineWidth: 0,
                },
                silent: true,
              },
              {
                type: 'polygon',
                shape: { points: baseGeometry.faces.top },
                style: {
                  fill: baseDeckFill,
                  lineWidth: 0,
                },
                silent: true,
              },
            )
          }

          children.push({
            type: 'text',
            style: {
              text: label,
              x: barX,
              y: baseGeometry.labelY,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              fill: text,
              fontSize: 12,
              fontWeight: 900,
              textBorderColor: themed(dataBar, 0.16),
              textBorderWidth: 1,
            },
            silent: true,
          })

          if (val <= 0) {
            children.push({
              type: 'text',
              style: {
                text: String(val),
                x: barX,
                y: axisY - AXIS_DEPTH - 9,
                textAlign: 'center',
                textVerticalAlign: 'bottom',
                fill: text,
                fontSize: 14,
                fontWeight: 900,
                textBorderColor: themed(dataBar, 0.18),
                textBorderWidth: 1,
              },
              silent: true,
            })

            return {
              type: 'group',
              children,
            }
          }

          const top = api.coord([api.value(0), val])
          const shape = { x: barX, y: top[1], xAxisPoint: cubeBase }
          const columnHeight = Math.max(6, cubeBase[1] - top[1])
          const liquidHeight = Math.min(
            LIQUID_MAX_HEIGHT,
            Math.max(LIQUID_MIN_HEIGHT, columnHeight * 0.24),
          )
          const liquidTopY = cubeBase[1] - liquidHeight
          const liquidShape = { x: barX, y: liquidTopY, xAxisPoint: cubeBase }

          children.push(
            {
              type: 'GlassColumnLeft',
              shape,
              style: {
                fill: glassLeftFill,
                stroke: colorWithAlpha(instrumentBaseRim, 0.38),
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnRight',
              shape,
              style: {
                fill: glassRightFill,
                stroke: colorWithAlpha(instrumentBase, 0.34),
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnTop',
              shape: { x: barX, y: top[1] },
              style: {
                fill: topCapFill,
                stroke: colorWithAlpha(instrumentBaseRim, 0.64),
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnLeft',
              shape: liquidShape,
              style: {
                fill: liquidFill,
                stroke: colorWithAlpha(dataBarSecondary, 0.45),
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnRight',
              shape: liquidShape,
              style: {
                fill: liquidSideFill,
                stroke: colorWithAlpha(dataBar, 0.28),
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnTop',
              shape: { x: barX, y: liquidTopY },
              style: {
                fill: liquidTopFill,
                stroke: colorWithAlpha(instrumentBaseRim, 0.72),
                lineWidth: 1,
              },
            },
            {
              type: 'text',
              style: {
                text: String(Math.round(val)),
                x: barX,
                y: Math.max(chartTop + 16, top[1] - CUBE_DEPTH * 2 - 8),
                textAlign: 'center',
                textVerticalAlign: 'bottom',
                fill: text,
                fontSize: 15,
                fontWeight: 900,
                textBorderColor: themed(dataBar, 0.2),
                textBorderWidth: 1,
              },
            },
          )

          return {
            type: 'group',
            children,
          }
        },
        data: animatedBarValues.map((value, index) => [index, value]),
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: themed(surfaceStrong, 0.92),
      borderColor: themed(dataBar, 0.8),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: 12, fontWeight: 700 },
      extraCssText: tooltipExtraCssText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const i = params.dataIndex
        return series.reduce(
          (html, item) => `${html}<br/>${item.name}：${item.data[i] || 0}`,
          `${labels[i]} 柱体 <b style="color:${dataBarSecondary}">${barValues[i]}</b> 合计 <b style="color:${dataBarSecondary}">${totals[i]}</b>`,
        )
      },
    },
  } as EChartsOption
})
</script>

<template>
  <div class="cube-bar-chart">
    <div class="cube-bar-legend" aria-hidden="true">
      <span><i class="is-all"></i>全部</span>
      <span><i class="is-onsite"></i>现场</span>
      <span><i class="is-factory"></i>厂家</span>
    </div>
    <EChart class="chart-bar" :option="option" height="100%" />
  </div>
</template>
