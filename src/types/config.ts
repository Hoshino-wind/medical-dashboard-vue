import type { ThemeId } from './theme'
import type { ChartModuleId, ModuleId } from './module'

export const CURRENT_DASHBOARD_CONFIG_VERSION = 2 as const

/** 布局类型:2行3列 / 3行3列 */
export type LayoutType = '2x3' | '3x3'

/** 卡片外观独立于配色主题，避免颜色与边框形态形成笛卡尔积 */
export const PANEL_STYLES = ['glass-flow', 'borderless', 'chamfered-instrument'] as const
export type PanelStyle = (typeof PANEL_STYLES)[number]

/** 配色模式:纯色 / 渐变色(环图与进度条通用) */
export const COLOR_MODES = ['solid', 'gradient'] as const
export type ColorMode = (typeof COLOR_MODES)[number]

/** 统计卡片的图表展示形态；只控制怎么画，不改变模块的数据来源。 */
export const CHART_DISPLAY_TYPES = ['line', 'bar'] as const
export type ChartDisplayType = (typeof CHART_DISPLAY_TYPES)[number]

/** 大屏配置(可序列化、可持久化到 localStorage) */
export interface DashboardConfig {
  schemaVersion: typeof CURRENT_DASHBOARD_CONFIG_VERSION
  themeId: ThemeId
  panelStyle: PanelStyle
  layout: LayoutType
  /** 环图配色模式 */
  ringColorMode: ColorMode
  /** 进度条配色模式(设备分布台数) */
  barColorMode: ColorMode
  /** 按模块 id 保存统计卡片的展示形态 */
  chartTypes: Record<ChartModuleId, ChartDisplayType>
  /** 唯一布局事实来源：数组下标就是大屏槽位。 */
  selectedModuleIds: Array<ModuleId | null>
}
