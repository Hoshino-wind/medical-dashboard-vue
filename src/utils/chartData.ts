import type { BarChartData, CartesianChartData } from '@/types/dashboard'

/**
 * 将单系列折线数据和多系列柱状数据统一成 series 结构。
 * 图表组件只依赖这一种内部形态，因此展示类型可独立切换。
 */
export function normalizeCartesianChartData(
  data: CartesianChartData,
  seriesName: string,
): BarChartData {
  if ('series' in data) return data

  return {
    labels: data.labels,
    series: [{ name: seriesName, data: data.data }],
  }
}
