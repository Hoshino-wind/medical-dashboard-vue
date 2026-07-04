import { dashboardData } from '@/data/mock/dashboardData'
import type { DashboardData } from '@/types/dashboard'

/**
 * 大屏数据统一访问入口。
 *
 * 所有业务组件应通过此 composable 获取数据,而不是直接 import mock 常量。
 * 当前实现返回静态 mock 数据;未来接入真实后端时,
 * 只需在此处替换为 API 请求并返回 ref<DashboardData | null> 即可,
 * 组件层无需改动。
 *
 * @example
 * const { data } = useDashboardData()
 * <OverviewModule :data="data.overview" />
 */
export function useDashboardData(): { data: DashboardData } {
  return { data: dashboardData }
}
