import type { EChartsOption } from '@/utils/echarts'
import type { BarChartData } from '@/types/dashboard'
import type { ThemeVariables } from '@/types/theme'
import { pxToRem } from '@/utils/rem'
import { resolveChartAxisRange } from '@/utils/chartAxis'
import { colorWithAlpha } from '@/utils/themeColor'
import { interpolateBarValue } from './cubeBarGeometry'
import { createCubeBarRenderItem } from './cubeBarRenderItem'
const MULTI_SERIES_GRID = { top: 50, bottom: 55 }
const SINGLE_SERIES_GRID = { top: 30, bottom: 42 }
const MULTI_SERIES_VALUE_LABEL_GAP = 5
const SINGLE_SERIES_VALUE_LABEL_GAP = 10

export interface SeriesTone {
  base: string
  accent: string
}

interface CubeBarOptionInput {
  data: BarChartData
  animationProgress: number
  token: (name: keyof ThemeVariables, fallback?: string) => string
  isLight: boolean
  seriesTones: SeriesTone[]
  fallbackTones: SeriesTone[]
}

/** 构建完整 ECharts option；组件只负责状态和生命周期。 */
export function buildCubeBarOption({
  data,
  animationProgress,
  token,
  isLight,
  seriesTones,
  fallbackTones,
}: CubeBarOptionInput): EChartsOption {
  const labels = data.labels
  const series = data.series
  const isSingleSeries = series.length === 1
  const chartGrid = isSingleSeries ? SINGLE_SERIES_GRID : MULTI_SERIES_GRID
  const valueLabelGap = isSingleSeries
    ? SINGLE_SERIES_VALUE_LABEL_GAP
    : MULTI_SERIES_VALUE_LABEL_GAP
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] || 0), 0))
  const categoryMaxValues = labels.map((_, i) =>
    Math.max(0, ...series.map((item) => item.data[i] || 0)),
  )
  const animatedSeriesValues = labels.map((_, labelIndex) =>
    series.map((item) => interpolateBarValue(item.data[labelIndex] || 0, animationProgress)),
  )
  const animatedCategoryMaxValues = animatedSeriesValues.map((values) => Math.max(0, ...values))
  const axisRange = resolveChartAxisRange(Math.max(0, ...categoryMaxValues))
  const text = token('--text')
  const muted = token('--muted')
  const grid = token('--chart-grid')
  const dataBar = token('--data-bar')
  const instrumentBase = token('--instrument-base')
  const instrumentBaseRim = token('--instrument-base-rim')
  const surface = token('--surface')
  const surfaceStrong = token('--surface-strong')
  const themed = colorWithAlpha
  const tooltipExtraCssText = `border-radius: ${pxToRem(8)}; box-shadow: 0 ${pxToRem(6)} ${pxToRem(18)} ${themed(dataBar, isLight ? 0.08 : 0.24)};`

  function resolveTone(index: number): SeriesTone {
    const safeIndex = Math.max(0, index)
    return seriesTones[safeIndex] ?? fallbackTones[safeIndex % fallbackTones.length]
  }

  return {
    animationDuration: 1000,
    // 单系列卡片自身带底部统计栏，压缩图内留白以扩大柱体绘图区；多系列保持原布局。
    grid: { left: 34, right: 18, top: chartGrid.top, bottom: chartGrid.bottom },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: axisRange.max,
      interval: axisRange.interval,
      axisLabel: { color: muted, fontSize: 12, fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1, type: 'dashed' } },
    },
    series: [
      {
        type: 'custom',
        encode: { x: 0, y: 1 },
        renderItem: createCubeBarRenderItem({
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
        }),
        data: animatedCategoryMaxValues.map((value, index) => [index, value]),
      },
    ],
    tooltip: {
      trigger: 'item',
      backgroundColor: themed(surfaceStrong, 0.92),
      borderColor: themed(dataBar, 0.8),
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: text, fontSize: 11, fontWeight: 700 },
      extraCssText: tooltipExtraCssText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        const i = params.dataIndex
        return series.reduce((html, item, seriesIndex) => {
          const tone = resolveTone(seriesIndex)
          return `${html}<br/><span style="color:${tone.base}">${item.name}：${item.data[i] || 0}</span>`
        }, `${labels[i]} 合计 <b style="color:${dataBar}">${totals[i]}</b>`)
      },
    },
  } as EChartsOption
}
