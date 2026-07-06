<script setup lang="ts">
import { computed } from 'vue'
import echarts, { type EChartsOption } from '@/utils/echarts'
import EChart from './EChart.vue'
import type { BarChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import { pxToRem } from '@/utils/rem'

const CUBE_HALF = 12
const CUBE_DEPTH = 7
const AXIS_DEPTH = 20
const AXIS_HEIGHT = 30
const AXIS_SLANT = 15
const LIQUID_MIN_HEIGHT = 10
const LIQUID_MAX_HEIGHT = 44
const tooltipExtraCssText = `border-radius: ${pxToRem(8)}; box-shadow: 0 ${pxToRem(6)} ${pxToRem(20)} rgba(0, 120, 220, 0.35);`

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

function token(name: keyof Theme['variables']): string {
  return props.theme.variables[name]
}

const option = computed(() => {
  const labels = props.data.labels
  const series = props.data.series
  const barValues = labels.map((_, i) => series.find((item) => (item.data[i] || 0) > 0)?.data[i] || 0)
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] || 0), 0))
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const accent = token('--accent')
  const accent2 = token('--accent-2')
  const accent3 = token('--accent-3')

  const glassLeftFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent3}d0` },
    { offset: 0.24, color: `${accent}d8` },
    { offset: 0.68, color: `${accent}72` },
    { offset: 1, color: `${accent2}28` },
  ])
  const glassRightFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent3}82` },
    { offset: 0.28, color: `${accent}a4` },
    { offset: 1, color: `${accent}20` },
  ])
  const topCapFill = new echarts.graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: `${accent3}f2` },
    { offset: 0.48, color: `${accent3}a8` },
    { offset: 1, color: `${accent}d8` },
  ])
  const liquidFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent2}dc` },
    { offset: 0.72, color: `${accent2}78` },
    { offset: 1, color: `${accent}24` },
  ])
  const liquidSideFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent2}a8` },
    { offset: 1, color: `${accent}1c` },
  ])
  const liquidTopFill = new echarts.graphic.RadialGradient(0.5, 0.55, 0.72, [
    { offset: 0, color: `${accent2}f5` },
    { offset: 0.56, color: `${accent2}86` },
    { offset: 1, color: `${accent}20` },
  ])
  const baseDeckFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent2}aa` },
    { offset: 0.34, color: `${accent2}5a` },
    { offset: 0.72, color: `${accent}24` },
    { offset: 1, color: `${accent}0a` },
  ])
  const baseFrontFill = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: `${accent2}38` },
    { offset: 0.2, color: `${accent}44` },
    { offset: 0.68, color: `${accent}18` },
    { offset: 1, color: `${accent}05` },
  ])

  return {
    animationDuration: 1000,
    grid: { left: 44, right: 16, top: 42, bottom: 48 },
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
        renderItem(_params: any, api: any) {
          const val = api.value(1)
          const index = api.value(0)
          const label = labels[index]
          const base = api.coord([api.value(0), 0])
          const band = Math.max(42, api.size([1, 0])[0])
          const axisX = base[0] - band * index - band * 0.49
          const axisWidth = band * labels.length * 0.98
          const axisY = base[1] + 1
          const barX = base[0] + AXIS_SLANT * 0.28
          const cubeBase = [barX, axisY - AXIS_DEPTH * 0.72]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const children: any[] = []

          if (index === 0) {
            children.push(
              {
                type: 'rect',
                shape: {
                  x: axisX - 12,
                  y: axisY - AXIS_DEPTH - 8,
                  width: axisWidth + AXIS_SLANT + 24,
                  height: AXIS_HEIGHT + AXIS_DEPTH + 18,
                },
                style: {
                  fill: `${accent2}08`,
                  shadowBlur: 36,
                  shadowColor: `${accent2}72`,
                },
                silent: true,
              },
              {
                type: 'CuboidAxisFront',
                shape: { x: axisX - 8, y: axisY + 7, width: axisWidth + 16 },
                style: {
                  fill: `${accent}12`,
                  stroke: `${accent}28`,
                  lineWidth: 1,
                  shadowBlur: 18,
                  shadowColor: `${accent}34`,
                },
                silent: true,
              },
              {
                type: 'CuboidAxisFront',
                shape: { x: axisX, y: axisY, width: axisWidth },
                style: {
                  fill: baseFrontFill,
                  stroke: `${accent}82`,
                  lineWidth: 1,
                  shadowBlur: 18,
                  shadowColor: `${accent2}54`,
                },
                silent: true,
              },
              {
                type: 'CuboidAxisRight',
                shape: { x: axisX, y: axisY, width: axisWidth },
                style: {
                  fill: `${accent}1e`,
                  stroke: `${accent2}68`,
                  lineWidth: 1,
                },
                silent: true,
              },
              {
                type: 'CuboidAxisTop',
                shape: { x: axisX, y: axisY, width: axisWidth },
                style: {
                  fill: baseDeckFill,
                  stroke: `${accent2}dc`,
                  lineWidth: 1,
                  shadowBlur: 22,
                  shadowColor: `${accent2}86`,
                },
                silent: true,
              },
              {
                type: 'line',
                shape: {
                  x1: axisX + AXIS_SLANT + 5,
                  y1: axisY - AXIS_DEPTH + 3,
                  x2: axisX + axisWidth + AXIS_SLANT - 6,
                  y2: axisY - AXIS_DEPTH + 3,
                },
                style: {
                  stroke: 'rgba(255,255,255,0.5)',
                  lineWidth: 1,
                  shadowBlur: 10,
                  shadowColor: `${accent2}cc`,
                },
                silent: true,
              },
              {
                type: 'line',
                shape: {
                  x1: axisX + 6,
                  y1: axisY + 3,
                  x2: axisX + axisWidth - 6,
                  y2: axisY + 3,
                },
                style: {
                  stroke: `${accent2}9c`,
                  lineWidth: 1,
                  shadowBlur: 12,
                  shadowColor: `${accent2}a0`,
                },
                silent: true,
              },
              {
                type: 'rect',
                shape: {
                  x: axisX + 12,
                  y: axisY + AXIS_HEIGHT - 4,
                  width: axisWidth - 24,
                  height: 2,
                },
                style: {
                  fill: `${accent2}6c`,
                  shadowBlur: 14,
                  shadowColor: `${accent2}bc`,
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
              y: axisY + AXIS_HEIGHT * 0.58,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              fill: text,
              fontSize: 12,
              fontWeight: 900,
              textBorderColor: 'rgba(0, 8, 24, 0.88)',
              textBorderWidth: 2,
              shadowBlur: 8,
              shadowColor: 'rgba(255,255,255,0.3)',
            },
            silent: true,
          })

          const renderValue = val > 0 ? val : 5
          const top = api.coord([api.value(0), renderValue])
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
                stroke: `${accent2}5f`,
                lineWidth: 1,
                shadowBlur: 18,
                shadowColor: `${accent}86`,
              },
            },
            {
              type: 'GlassColumnRight',
              shape,
              style: {
                fill: glassRightFill,
                stroke: `${accent}42`,
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnTop',
              shape: { x: barX, y: top[1] },
              style: {
                fill: topCapFill,
                stroke: `${accent3}dd`,
                lineWidth: 1,
                shadowBlur: 16,
                shadowColor: `${accent3}aa`,
              },
            },
            {
              type: 'GlassColumnLeft',
              shape: liquidShape,
              style: {
                fill: liquidFill,
                stroke: `${accent2}72`,
                lineWidth: 1,
                shadowBlur: 16,
                shadowColor: `${accent2}8c`,
              },
            },
            {
              type: 'GlassColumnRight',
              shape: liquidShape,
              style: {
                fill: liquidSideFill,
                stroke: `${accent2}36`,
                lineWidth: 1,
              },
            },
            {
              type: 'GlassColumnTop',
              shape: { x: barX, y: liquidTopY },
              style: {
                fill: liquidTopFill,
                stroke: `${accent2}d6`,
                lineWidth: 1,
                shadowBlur: 14,
                shadowColor: `${accent2}9c`,
              },
            },
            {
              type: 'line',
              shape: {
                x1: barX - CUBE_HALF * 0.35,
                y1: top[1] + CUBE_DEPTH + 4,
                x2: barX - CUBE_HALF * 0.35,
                y2: cubeBase[1] - CUBE_DEPTH - 4,
              },
              style: {
                stroke: 'rgba(255,255,255,0.36)',
                lineWidth: 1,
                shadowBlur: 7,
                shadowColor: `${accent2}bb`,
              },
              silent: true,
            },
            {
              type: 'circle',
              shape: { cx: barX - CUBE_HALF * 0.38, cy: top[1] + columnHeight * 0.28, r: 1.8 },
              style: { fill: 'rgba(255,255,255,0.74)', shadowBlur: 7, shadowColor: '#fff' },
              silent: true,
            },
            {
              type: 'text',
              style: {
                text: String(val),
                x: barX,
                y: top[1] - CUBE_DEPTH * 2 - 11,
                textAlign: 'center',
                textVerticalAlign: 'middle',
                fill: '#ffffff',
                fontSize: 15,
                fontWeight: 900,
                textBorderColor: 'rgba(0, 7, 20, 0.92)',
                textBorderWidth: 3,
                shadowBlur: 10,
                shadowColor: `${accent}aa`,
              },
            },
          )

          return {
            type: 'group',
            children,
          }
        },
        data: barValues.map((value, index) => [index, value]),
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(6, 20, 48, 0.92)',
      borderColor: `${accent}cc`,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: 12, fontWeight: 700 },
      extraCssText: tooltipExtraCssText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const i = params.dataIndex
        return series.reduce(
          (html, item) => `${html}<br/>${item.name}：${item.data[i] || 0}`,
          `${labels[i]} 柱体 <b style="color:${accent2}">${barValues[i]}</b> 合计 <b style="color:${accent2}">${totals[i]}</b>`,
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
