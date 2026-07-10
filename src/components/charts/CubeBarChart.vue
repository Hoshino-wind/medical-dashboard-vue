<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import echarts, { type EChartsOption } from '@/utils/echarts'
import EChart from './EChart.vue'
import type { BarChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import { pxToRem } from '@/utils/rem'
import { chartFontSize } from '@/utils/fontScale'
import { colorWithAlpha } from '@/utils/themeColor'
import { formatMonthAxisLabel, resolveCountAxisScale } from './chartAxisScale'
import {
  BASE_DROP,
  BASE_VERTICAL_OFFSET,
  BAR_ANIMATION_DURATION,
  createColumnBasePoint,
  createBaseCuboidGeometry,
  findPeakSeriesIndex,
  interpolateBarValue,
} from './cubeBarGeometry'

const CUBE_HALF = 7
const CUBE_DEPTH = 3
const AXIS_DEPTH = 20
const AXIS_HEIGHT = 30
const AXIS_SLANT = 15

interface SeriesTone {
  base: string
  accent: string
}

interface LegendItem {
  name: string
  tone: SeriesTone
  textStyle: CSSProperties
  swatchStyle: CSSProperties
}

// 玻璃柱体由左右面、顶面、内部青色液面叠加，方便接近参考图的透明 3D 质感。
// 柱体半宽通过 shape.cubeHalf 动态传入，实现随 band 自适应；未传时回退到常量。
const GlassColumnLeft = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0], cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const p = shape.xAxisPoint
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x - half, shape.y - CUBE_DEPTH)
    ctx.lineTo(p[0] - half, p[1] - CUBE_DEPTH)
    ctx.lineTo(p[0], p[1])
    ctx.closePath()
  },
})

const GlassColumnRight = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0], cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const p = shape.xAxisPoint
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(p[0], p[1])
    ctx.lineTo(p[0] + half, p[1] - CUBE_DEPTH)
    ctx.lineTo(shape.x + half, shape.y - CUBE_DEPTH)
    ctx.closePath()
  },
})

const GlassColumnTop = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + half, shape.y - CUBE_DEPTH)
    ctx.lineTo(shape.x, shape.y - CUBE_DEPTH * 2)
    ctx.lineTo(shape.x - half, shape.y - CUBE_DEPTH)
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

const peakSeriesIndex = computed(() => {
  const totals = props.data.series.map((item) => item.data.reduce((sum, value) => sum + value, 0))
  return findPeakSeriesIndex(totals)
})

const animationProgress = ref(0)
let animationFrame = 0

function token(name: keyof Theme['variables']): string {
  return props.theme.variables[name]
}

const seriesTonePalette = computed<SeriesTone[]>(() => [
  { base: token('--data-bar'), accent: token('--data-bar-secondary') },
  { base: token('--data-health-pie-warning'), accent: token('--warn') },
  { base: token('--data-health-pie-repairing'), accent: token('--danger') },
])

const legendItems = computed<LegendItem[]>(() => {
  const palette = seriesTonePalette.value

  return props.data.series.map((item, index) => {
    const tone = palette[index % palette.length]

    return {
      name: item.name,
      tone,
      textStyle: {
        color: colorWithAlpha(tone.base, 0.96),
      },
      swatchStyle: {
        color: colorWithAlpha(tone.base, 0.96),
        background: `linear-gradient(135deg, ${colorWithAlpha(tone.accent, 0.88)}, ${colorWithAlpha(tone.base, 0.46)})`,
        boxShadow: `0 0 ${pxToRem(8)} ${colorWithAlpha(tone.base, 0.3)}`,
      },
    }
  })
})

// 柱宽与间距均随 band 自适应：组宽占 band 的 64%，组内柱子紧凑排列，柱间留 16% 间隙
function resolveBarMetrics(band: number, seriesCount: number) {
  const sc = Math.max(1, seriesCount)
  const groupWidth = band * 0.64
  // barWidth*(sc + 0.16*(sc-1)) = groupWidth，柱间间隙 = barWidth*0.16
  const barWidth = groupWidth / (sc + 0.16 * (sc - 1))
  const cubeHalf = Math.max(CUBE_HALF, Math.round(barWidth / 2))
  const step = barWidth * 1.16 // 中心距 = 柱宽 + 间隙
  return { cubeHalf, step }
}

function columnOffset(seriesIndex: number, seriesCount: number, step: number): number {
  return (seriesIndex - (seriesCount - 1) / 2) * step
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
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] || 0), 0))
  const categoryMaxValues = labels.map((_, i) =>
    Math.max(0, ...series.map((item) => item.data[i] || 0)),
  )
  const animatedSeriesValues = labels.map((_, labelIndex) =>
    series.map((item) => interpolateBarValue(item.data[labelIndex] || 0, animationProgress.value)),
  )
  const animatedCategoryMaxValues = animatedSeriesValues.map((values) =>
    Math.max(0, ...values),
  )
  const { max: axisMax, interval: axisInterval } = resolveCountAxisScale(categoryMaxValues)
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const dataBar = token('--data-bar')
  const instrumentBase = token('--instrument-base')
  const instrumentBaseRim = token('--instrument-base-rim')
  const surface = token('--surface')
  const surfaceStrong = token('--surface-strong')
  const fallbackTones = seriesTonePalette.value
  const seriesTones = legendItems.value.map((item) => item.tone)
  const themed = colorWithAlpha
  const isLight = props.theme.id.startsWith('light-')
  const tooltipExtraCssText = `border-radius: ${pxToRem(8)}; box-shadow: 0 ${pxToRem(6)} ${pxToRem(18)} ${themed(dataBar, isLight ? 0.08 : 0.24)};`

  function resolveTone(index: number): SeriesTone {
    const safeIndex = Math.max(0, index)
    return seriesTones[safeIndex] ?? fallbackTones[safeIndex % fallbackTones.length]
  }

  function columnFills(tone: SeriesTone) {
    return {
      left: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: colorWithAlpha(tone.accent, isLight ? 0.74 : 0.82) },
        { offset: 0.55, color: colorWithAlpha(tone.base, isLight ? 0.42 : 0.56) },
        { offset: 1, color: colorWithAlpha(tone.base, isLight ? 0.14 : 0.2) },
      ]),
      right: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: colorWithAlpha(tone.base, isLight ? 0.58 : 0.7) },
        { offset: 1, color: colorWithAlpha(tone.base, isLight ? 0.1 : 0.14) },
      ]),
      top: new echarts.graphic.RadialGradient(0.5, 0.55, 0.72, [
        { offset: 0, color: colorWithAlpha(instrumentBaseRim, isLight ? 0.54 : 0.72) },
        { offset: 0.58, color: colorWithAlpha(tone.accent, isLight ? 0.46 : 0.58) },
        { offset: 1, color: colorWithAlpha(tone.base, isLight ? 0.16 : 0.22) },
      ]),
    }
  }

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
      max: axisMax,
      interval: axisInterval,
      axisLabel: { color: muted, fontSize: chartFontSize(11), fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1, type: 'dashed' } },
    },
    series: [
      {
        type: 'custom',
        encode: { x: 0, y: 1 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem(params: any, api: any) {
          const val = Number(api.value(1) || 0)
          const index = Number(api.value(0))
          const label = labels[index]
          const base = api.coord([index, 0])
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
              text: formatMonthAxisLabel(label),
              x: barX,
              y: baseGeometry.labelY,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              fill: text,
              fontSize: chartFontSize(12),
              fontWeight: 900,
              textBorderColor: themed(dataBar, 0.16),
              textBorderWidth: 1,
            },
            silent: true,
          })

          const values = animatedSeriesValues[index] ?? []
          // 基于当前 band 自适应计算柱体半宽与组内间距
          const { cubeHalf, step } = resolveBarMetrics(band, series.length)
          values.forEach((seriesValue, seriesIndex) => {
            const categoryX = base[0] + columnOffset(seriesIndex, series.length, step)
            const columnBase = createColumnBasePoint({
              categoryX,
              axisY,
              slant: AXIS_SLANT,
              depth: AXIS_DEPTH,
            })
            const columnX = columnBase[0]
            const tone = resolveTone(seriesIndex)
            const fills = columnFills(tone)
            const isPeakSeries = seriesIndex === peakSeriesIndex.value

            if (seriesValue <= 0) {
              // 值为 0 时不渲染任何底图/占位，直接跳过
              return
            }

            const upperY = api.coord([index, seriesValue])[1]
            const shape = { x: columnX, y: upperY, xAxisPoint: columnBase, cubeHalf }

            children.push(
              {
                type: 'GlassColumnLeft',
                shape,
                style: {
                  fill: fills.left,
                  stroke: colorWithAlpha(tone.accent, 0.5),
                  lineWidth: 1,
                },
              },
              {
                type: 'GlassColumnRight',
                shape,
                style: {
                  fill: fills.right,
                  stroke: colorWithAlpha(tone.base, 0.34),
                  lineWidth: 1,
                },
              },
              {
                type: 'GlassColumnTop',
                shape: { x: columnX, y: upperY, cubeHalf },
                style: {
                  fill: fills.top,
                  stroke: colorWithAlpha(tone.accent, 0.72),
                  lineWidth: 1,
                  ...(isPeakSeries
                    ? {
                        shadowBlur: isLight ? 5 : 10,
                        shadowColor: colorWithAlpha(tone.accent, isLight ? 0.2 : 0.42),
                      }
                    : {}),
                },
              },
              {
                type: 'text',
                style: {
                  text: String(Math.round(seriesValue)),
                  x: columnX,
                  y: Math.max(chartTop + 12, upperY - CUBE_DEPTH * 2 - 5),
                  textAlign: 'center',
                  textVerticalAlign: 'bottom',
                  fill: text,
                  fontSize: chartFontSize(10),
                  fontWeight: 900,
                  textBorderColor: themed(tone.base, 0.28),
                  textBorderWidth: 1,
                },
                silent: true,
              },
            )
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
                fontSize: chartFontSize(14),
                fontWeight: 900,
                textBorderColor: themed(dataBar, 0.18),
                textBorderWidth: 1,
              },
              silent: true,
            })
          }

          return {
            type: 'group',
            children,
          }
        },
        data: animatedCategoryMaxValues.map((value, index) => [index, value]),
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: themed(surfaceStrong, 0.92),
      borderColor: themed(dataBar, 0.8),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: chartFontSize(12), fontWeight: 700 },
      extraCssText: tooltipExtraCssText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const i = params.dataIndex
        return series.reduce(
          (html, item, seriesIndex) => {
            const tone = resolveTone(seriesIndex)
            return `${html}<br/><span style="color:${tone.base}">${item.name}：${item.data[i] || 0}</span>`
          },
          `${labels[i]} 合计 <b style="color:${dataBar}">${totals[i]}</b>`,
        )
      },
    },
  } as EChartsOption
})
</script>

<template>
  <div class="cube-bar-chart" :data-peak-series="peakSeriesIndex">
    <span class="cube-bar-ground-scan" aria-hidden="true"></span>
    <div class="cube-bar-legend" aria-hidden="true">
      <span v-for="item in legendItems" :key="item.name" :style="item.textStyle">
        <i :style="item.swatchStyle"></i>{{ item.name }}
      </span>
    </div>
    <EChart
      class="chart-bar"
      :option="option"
      height="100%"
      accessible-label="保修统计 2.5D 柱状图"
    />
  </div>
</template>
