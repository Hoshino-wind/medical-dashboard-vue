import type { ThemeId } from './theme'

/** 布局类型:2行3列 / 3行3列 */
export type LayoutType = '2x3' | '3x3'

/** 卡片外观独立于配色主题，避免颜色与边框形态形成笛卡尔积 */
export const PANEL_STYLES = ['glass-flow', 'borderless', 'chamfered-instrument'] as const
export type PanelStyle = (typeof PANEL_STYLES)[number]

/** 配色模式:纯色 / 渐变色(环图与进度条通用) */
export const COLOR_MODES = ['solid', 'gradient'] as const
export type ColorMode = (typeof COLOR_MODES)[number]

/** 大屏配置(可序列化、可持久化到 localStorage) */
export interface DashboardConfig {
  themeId: ThemeId
  panelStyle: PanelStyle
  layout: LayoutType
  /** 环图配色模式 */
  ringColorMode: ColorMode
  /** 进度条配色模式(设备分布台数) */
  barColorMode: ColorMode
  selectedModuleIds: Array<string | null>
  moduleOrder: string[]
}
