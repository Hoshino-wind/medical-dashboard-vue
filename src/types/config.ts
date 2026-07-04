import type { ThemeId } from './theme'

/** 布局类型:2行3列 / 3行3列 */
export type LayoutType = '2x3' | '3x3'

/** 大屏配置(可序列化、可持久化到 localStorage) */
export interface DashboardConfig {
  themeId: ThemeId
  layout: LayoutType
  moduleOrder: string[]
}
