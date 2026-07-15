import type { ThemeId } from './theme'

/** 布局类型:2行3列 / 3行3列 */
export type LayoutType = '2x3' | '3x3'

/** 卡片外观独立于配色主题，避免颜色与边框形态形成笛卡尔积 */
export const PANEL_STYLES = ['glass-flow', 'borderless', 'chamfered-instrument'] as const
export type PanelStyle = (typeof PANEL_STYLES)[number]

/** 大屏配置(可序列化、可持久化到 localStorage) */
export interface DashboardConfig {
  themeId: ThemeId
  panelStyle: PanelStyle
  layout: LayoutType
  selectedModuleIds: Array<string | null>
  moduleOrder: string[]
}
