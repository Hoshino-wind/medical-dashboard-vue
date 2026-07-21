import echarts from '@/utils/echarts'
import type { BarChartData } from '@/types/dashboard'
import { colorWithAlpha, mixColor } from '@/utils/themeColor'
import {
  BASE_DROP,
  BASE_VERTICAL_OFFSET,
  createBaseCuboidGeometry,
  createColumnBasePoint,
} from './cubeBarGeometry'
import { AXIS_DEPTH, AXIS_SLANT, CUBE_DEPTH, CUBE_HALF } from './cubeBarShapes'
import type { SeriesTone } from './cubeBarOption'

const SINGLE_SERIES_MAX_CUBE_HALF = 10

interface CubeBarRenderItemInput {
  labels: string[]
  series: BarChartData['series']
  animatedSeriesValues: number[][]
  valueLabelGap: number
  text: string
  dataBar: string
  instrumentBase: string
  instrumentBaseRim: string
  surface: string
  surfaceStrong: string
  isLight: boolean
  resolveTone: (index: number) => SeriesTone
}

function resolveBarMetrics(band: number, seriesCount: number) {
  const count = Math.max(1, seriesCount)
  const groupWidth = band * 0.64
  const barWidth = groupWidth / (count + 0.16 * (count - 1))
  const naturalCubeHalf = Math.round(barWidth / 2)
  const cappedCubeHalf =
    count === 1 ? Math.min(naturalCubeHalf, SINGLE_SERIES_MAX_CUBE_HALF) : naturalCubeHalf
  return { cubeHalf: Math.max(CUBE_HALF, cappedCubeHalf), step: barWidth * 1.16 }
}

function columnOffset(seriesIndex: number, seriesCount: number, step: number): number {
  return (seriesIndex - (seriesCount - 1) / 2) * step
}

/** 构建单个类目组的 3D 柱、底座和标签渲染函数。 */
export function createCubeBarRenderItem(input: CubeBarRenderItemInput) {
  const {
    labels,
    series,
    animatedSeriesValues,
    valueLabelGap,
    text,
    dataBar,
    instrumentBase,
    instrumentBaseRim,
    surface,
    surfaceStrong,
    isLight,
    resolveTone,
  } = input
  const themed = colorWithAlpha

  function columnFills(tone: SeriesTone) {
    const jellyLight = mixColor(tone.accent, '#ffffff', isLight ? 0.22 : 0.36)
    const jellyMid = mixColor(tone.base, tone.accent, 0.38)
    const jellyDeep = mixColor(tone.base, surfaceStrong, isLight ? 0.12 : 0.28)
    const jellyBounce = mixColor(tone.base, '#ffffff', isLight ? 0.08 : 0.16)
    return {
      left: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: themed(jellyLight, isLight ? 0.92 : 0.98) },
        { offset: 0.16, color: themed(tone.accent, isLight ? 0.86 : 0.94) },
        { offset: 0.52, color: themed(jellyMid, isLight ? 0.68 : 0.78) },
        { offset: 0.82, color: themed(jellyDeep, isLight ? 0.58 : 0.68) },
        { offset: 1, color: themed(jellyBounce, isLight ? 0.82 : 0.9) },
      ]),
      right: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: themed(jellyLight, isLight ? 0.76 : 0.88) },
        { offset: 0.34, color: themed(jellyMid, isLight ? 0.62 : 0.72) },
        { offset: 0.76, color: themed(jellyDeep, isLight ? 0.5 : 0.6) },
        { offset: 1, color: themed(jellyBounce, isLight ? 0.72 : 0.8) },
      ]),
      top: new echarts.graphic.RadialGradient(0.42, 0.38, 0.78, [
        { offset: 0, color: themed('#ffffff', isLight ? 0.72 : 0.88) },
        { offset: 0.26, color: themed(jellyLight, isLight ? 0.9 : 0.98) },
        { offset: 0.72, color: themed(tone.accent, isLight ? 0.7 : 0.82) },
        { offset: 1, color: themed(tone.base, isLight ? 0.5 : 0.62) },
      ]),
      specular: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: themed('#ffffff', isLight ? 0.48 : 0.62) },
        { offset: 0.2, color: themed('#ffffff', isLight ? 0.24 : 0.34) },
        { offset: 0.62, color: themed(jellyLight, isLight ? 0.08 : 0.14) },
        { offset: 1, color: themed(tone.base, 0) },
      ]),
      shadow: themed(tone.base, isLight ? 0.18 : 0.32),
    }
  }

  const baseFills = {
    left: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: themed(instrumentBaseRim, 0.13) },
      { offset: 0.52, color: themed(instrumentBase, 0.2) },
      { offset: 1, color: themed(surface, 0.24) },
    ]),
    deck: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: themed(instrumentBaseRim, 0.28) },
      { offset: 0.36, color: themed(instrumentBase, 0.44) },
      { offset: 0.72, color: themed(instrumentBase, 0.3) },
      { offset: 1, color: themed(surfaceStrong, 0.22) },
    ]),
    front: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: themed(instrumentBaseRim, 0.2) },
      { offset: 0.3, color: themed(instrumentBase, 0.18) },
      { offset: 0.72, color: themed(surfaceStrong, 0.34) },
      { offset: 1, color: themed(surface, 0.18) },
    ]),
    right: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
      { offset: 0, color: themed(instrumentBaseRim, 0.14) },
      { offset: 0.58, color: themed(instrumentBase, 0.18) },
      { offset: 1, color: themed(surface, 0.16) },
    ]),
  }

  // ECharts custom series 的 API 类型尚未完整暴露，边界内集中收敛动态类型。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (params: any, api: any) => {
    const value = Number(api.value(1) || 0)
    const index = Number(api.value(0))
    const base = api.coord([index, 0])
    const chartTop = params.coordSys?.y ?? 0
    const band = Math.max(42, api.size([1, 0])[0])
    const geometry = createBaseCuboidGeometry({
      axisX: base[0] - band * index - band * 0.49,
      baseY: base[1] + 1,
      width: band * labels.length * 0.98,
      slant: AXIS_SLANT,
      depth: AXIS_DEPTH,
      drop: BASE_DROP,
      offsetY: BASE_VERTICAL_OFFSET,
    })
    const cubeBase = createColumnBasePoint({
      categoryX: base[0],
      axisY: geometry.axisY,
      slant: AXIS_SLANT,
      depth: AXIS_DEPTH,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = []

    if (index === 0) {
      children.push(
        {
          type: 'polygon',
          shape: { points: geometry.faces.left },
          style: { fill: baseFills.left, lineWidth: 0 },
          silent: true,
        },
        {
          type: 'polygon',
          shape: { points: geometry.faces.front },
          style: { fill: baseFills.front, lineWidth: 0 },
          silent: true,
        },
        {
          type: 'polygon',
          shape: { points: geometry.faces.right },
          style: { fill: baseFills.right, lineWidth: 0 },
          silent: true,
        },
        {
          type: 'polygon',
          shape: { points: geometry.faces.top },
          style: { fill: baseFills.deck, lineWidth: 0 },
          silent: true,
        },
      )
    }

    children.push({
      type: 'text',
      style: {
        text: labels[index],
        x: cubeBase[0],
        y: geometry.labelY,
        textAlign: 'center',
        textVerticalAlign: 'middle',
        fill: text,
        fontSize: 11,
        fontWeight: 900,
        textBorderColor: themed(dataBar, 0.16),
        textBorderWidth: 1,
      },
      silent: true,
    })

    const values = animatedSeriesValues[index] ?? []
    const { cubeHalf, step } = resolveBarMetrics(band, series.length)
    values.forEach((seriesValue, seriesIndex) => {
      if (seriesValue <= 0) return
      const columnBase = createColumnBasePoint({
        categoryX: base[0] + columnOffset(seriesIndex, series.length, step),
        axisY: geometry.axisY,
        slant: AXIS_SLANT,
        depth: AXIS_DEPTH,
      })
      const columnX = columnBase[0]
      const upperY = api.coord([index, seriesValue])[1]
      const tone = resolveTone(seriesIndex)
      const fills = columnFills(tone)
      const shape = { x: columnX, y: upperY, xAxisPoint: columnBase, cubeHalf }

      children.push(
        {
          type: 'GlassColumnLeft',
          shape,
          style: {
            fill: fills.left,
            stroke: themed(tone.accent, 0.5),
            lineWidth: 1,
            shadowBlur: isLight ? 3 : 8,
            shadowColor: fills.shadow,
          },
        },
        {
          type: 'GlassColumnRight',
          shape,
          style: { fill: fills.right, stroke: themed(tone.base, 0.34), lineWidth: 1 },
        },
        {
          type: 'polygon',
          name: 'jelly-specular',
          shape: {
            points: [
              [columnX - cubeHalf * 0.72, upperY - CUBE_DEPTH * 0.72],
              [columnX - cubeHalf * 0.38, upperY - CUBE_DEPTH * 0.38],
              [columnBase[0] - cubeHalf * 0.38, columnBase[1] - CUBE_DEPTH * 0.38],
              [columnBase[0] - cubeHalf * 0.72, columnBase[1] - CUBE_DEPTH * 0.72],
            ],
          },
          style: { fill: fills.specular },
          silent: true,
        },
        {
          type: 'GlassColumnTop',
          shape: { x: columnX, y: upperY, cubeHalf },
          style: {
            fill: fills.top,
            stroke: themed(tone.accent, 0.72),
            lineWidth: 1,
            shadowBlur: isLight ? 2 : 6,
            shadowColor: fills.shadow,
          },
        },
        {
          type: 'text',
          style: {
            text: String(Math.round(seriesValue)),
            x: columnX,
            y: Math.max(chartTop + 12, upperY - CUBE_DEPTH * 2 - valueLabelGap),
            textAlign: 'center',
            textVerticalAlign: 'bottom',
            fill: text,
            fontSize: 8,
            fontWeight: 900,
            textBorderColor: themed(tone.base, 0.28),
            textBorderWidth: 1,
          },
          silent: true,
        },
      )
    })

    if (value <= 0) {
      children.push({
        type: 'text',
        style: {
          text: String(value),
          x: cubeBase[0],
          y: geometry.axisY - AXIS_DEPTH - 9,
          textAlign: 'center',
          textVerticalAlign: 'bottom',
          fill: text,
          fontSize: 12,
          fontWeight: 900,
          textBorderColor: themed(dataBar, 0.18),
          textBorderWidth: 1,
        },
        silent: true,
      })
    }

    return { type: 'group', children }
  }
}
